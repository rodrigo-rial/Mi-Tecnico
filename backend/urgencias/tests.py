from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from decimal import Decimal
from django.test import TransactionTestCase
from django.db import close_old_connections
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework.test import APITestCase
from solicitudes.tests import crear_usuario, crear_tecnico
from solicitudes.models import Trabajo
from solicitudes.services import cambiar_estado_trabajo, aceptar_propuesta
from solicitudes.test_trabajos import EscenarioBase
from tecnicos.models import Especialidad, Zona, PerfilTecnico
from tokens.models import TokenTrabajo
from .models import Disponibilidad, Urgencia, Asignacion
from . import services


class Escenario:
    def preparar(self):
        self.e, _ = Especialidad.objects.get_or_create(nombre="Electricidad")
        self.z, _ = Zona.objects.get_or_create(nombre="Tolosa")
        self.cliente = crear_usuario("urg-cliente", "CLIENTE")
        self.tecnico = crear_tecnico("urg-tecnico", [self.e], [self.z])
        self.datos = dict(especialidad=self.e, zona=self.z, descripcion="Sin luz", direccion="Calle 1")

    def disponible(self, tecnico=None):
        services.cambiar_disponibilidad(tecnico or self.tecnico, True)


class UrgenciasTests(Escenario, APITestCase):
    def setUp(self):
        self.preparar()

    def test_asigna_reserva_y_genera_token(self):
        self.disponible()
        u = services.crear(self.cliente, self.datos)
        self.assertEqual(u.estado, "asignada")
        t = u.asignaciones.get().trabajo
        self.assertEqual(t.tecnico_id, self.tecnico.pk)
        self.assertEqual(t.precio_acordado, Decimal("40000"))
        self.assertTrue(TokenTrabajo.objects.filter(trabajo=t, estado="generado").exists())
        self.assertFalse(Disponibilidad.objects.get(tecnico=self.tecnico).activa)

    def test_busca_y_asigna_cuando_se_activa_tecnico(self):
        u = services.crear(self.cliente, self.datos)
        self.assertEqual(u.estado, "buscando")
        self.disponible()
        u.refresh_from_db()
        self.assertEqual(u.estado, "asignada")

    def test_cancelacion_tecnico_busca_reemplazo_y_anula_token(self):
        otro = crear_tecnico("reemplazo", [self.e], [self.z])
        self.disponible(); self.disponible(otro)
        u = services.crear(self.cliente, self.datos)
        anterior = u.asignaciones.get().trabajo
        cambiar_estado_trabajo(anterior, self.tecnico, "cancelado")
        u.refresh_from_db()
        self.assertEqual(u.estado, "asignada")
        self.assertEqual(u.asignaciones.count(), 2)
        self.assertEqual(u.asignaciones.order_by("-pk").first().trabajo.tecnico_id, otro.pk)
        self.assertEqual(TokenTrabajo.objects.get(trabajo=anterior).estado, "cancelado")
        self.assertFalse(Disponibilidad.objects.get(tecnico=self.tecnico).activa)

    def test_no_reasigna_al_que_cancelo(self):
        self.disponible()
        u = services.crear(self.cliente, self.datos)
        cambiar_estado_trabajo(u.asignaciones.get().trabajo, self.tecnico, "cancelado")
        self.disponible()
        services.procesar_pendientes()
        u.refresh_from_db()
        self.assertEqual(u.estado, "buscando")
        self.assertEqual(u.asignaciones.count(), 1)

    def test_cliente_cancela_y_no_se_reasigna(self):
        self.disponible()
        u = services.crear(self.cliente, self.datos)
        services.cancelar(u, self.cliente)
        self.assertEqual(u.estado, "cancelada")
        self.assertEqual(u.asignaciones.get().trabajo.estado, "cancelado")
        services.procesar_pendientes()
        self.assertEqual(u.asignaciones.count(), 1)

    def test_cliente_cancela_busqueda(self):
        u = services.crear(self.cliente, self.datos)
        services.cancelar(u, self.cliente)
        self.disponible()
        self.assertFalse(u.asignaciones.exists())

    def test_no_admite_dos_urgencias_activas(self):
        services.crear(self.cliente, self.datos)
        with self.assertRaises(ValidationError): services.crear(self.cliente, self.datos)

    def test_no_asigna_a_ocupado(self):
        self.disponible()
        services.crear(self.cliente, self.datos)
        otro = crear_usuario("cliente2", "CLIENTE")
        u = services.crear(otro, self.datos)
        self.assertEqual(u.estado, "buscando")
        with self.assertRaises(ValidationError): self.disponible()

    def test_rechaza_tecnicos_no_aprobados_o_bloqueados(self):
        for estado in ["PENDIENTE", "RECHAZADO"]:
            PerfilTecnico.objects.filter(usuario=self.tecnico).update(estado_validacion=estado)
            with self.assertRaises(ValidationError): self.disponible()
        PerfilTecnico.objects.filter(usuario=self.tecnico).update(estado_validacion="APROBADO")
        self.disponible()
        self.tecnico.is_active = False
        self.tecnico.save()
        self.assertEqual(services.crear(self.cliente, self.datos).estado, "buscando")

    def test_aprobacion_revocada_no_asigna_aunque_siga_disponible(self):
        self.disponible()
        PerfilTecnico.objects.filter(usuario=self.tecnico).update(estado_validacion="RECHAZADO")
        urgencia = services.crear(self.cliente, self.datos)
        services.procesar_pendientes()
        urgencia.refresh_from_db()
        self.assertEqual(urgencia.estado, "buscando")
        self.assertFalse(urgencia.asignaciones.exists())
        self.assertFalse(TokenTrabajo.objects.exists())

    def test_cliente_bloqueado_no_recibe_asignacion_pendiente(self):
        urgencia = services.crear(self.cliente, self.datos)
        self.cliente.is_active = False
        self.cliente.save(update_fields=["is_active"])
        self.disponible()
        urgencia.refresh_from_db()
        self.assertEqual(urgencia.estado, "cancelada")
        self.assertFalse(urgencia.asignaciones.exists())
        self.assertTrue(Disponibilidad.objects.get(tecnico=self.tecnico).activa)

    def test_zona_y_especialidad_deben_coincidir(self):
        self.disponible()
        PerfilTecnico.objects.get(usuario=self.tecnico).zonas.clear()
        u = services.crear(self.cliente, self.datos)
        self.assertEqual(u.estado, "buscando")
        perfil = PerfilTecnico.objects.get(usuario=self.tecnico)
        perfil.zonas.add(self.z); perfil.especialidades.clear()
        services.procesar_pendientes()
        u.refresh_from_db()
        self.assertEqual(u.estado, "buscando")

    def test_desactivar_no_cancela_visita(self):
        self.disponible()
        u = services.crear(self.cliente, self.datos)
        services.cambiar_disponibilidad(self.tecnico, False)
        self.assertEqual(u.asignaciones.get().trabajo.estado, "pendiente")

    def test_flujo_seguro_hasta_finalizar(self):
        self.disponible()
        u = services.crear(self.cliente, self.datos)
        t = u.asignaciones.get().trabajo
        with self.assertRaises(ValidationError): cambiar_estado_trabajo(t, self.tecnico, "en_proceso")
        self.client.force_authenticate(self.cliente)
        token = TokenTrabajo.objects.get(trabajo=t)
        res = self.client.post(reverse("token-validar", args=[t.pk]), {"codigo": token.codigo})
        self.assertEqual(res.status_code, 200)
        cambiar_estado_trabajo(t, self.tecnico, "finalizado")
        u.refresh_from_db()
        self.assertEqual(u.estado, "finalizada")

    def test_api_permisos_tarifa_y_validacion(self):
        url = reverse("urgencias")
        self.assertEqual(self.client.post(url, {}).status_code, 401)
        self.client.force_authenticate(self.tecnico)
        datos = {**self.datos, "especialidad": self.e.pk, "zona": self.z.pk, "tarifa_visita": 1}
        self.assertEqual(self.client.post(url, datos).status_code, 403)
        self.client.force_authenticate(self.cliente)
        self.assertEqual(self.client.post(url, {**datos, "direccion": " "}).status_code, 400)
        res = self.client.post(url, datos)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Decimal(res.data["tarifa_visita"]), Decimal("40000"))
        otro = crear_usuario("ajeno", "CLIENTE")
        self.client.force_authenticate(otro)
        self.assertEqual(self.client.get(url).data, [])
        self.assertEqual(self.client.post(reverse("urgencia-cancelar", args=[res.data["id"]])).status_code, 404)

    def test_recorrido_api_con_reemplazo_codigo_y_finalizacion(self):
        otro = crear_tecnico("segundo-api", [self.e], [self.z])
        for tecnico in [self.tecnico, otro]:
            self.client.force_authenticate(tecnico)
            res = self.client.patch(reverse("urgencia-disponibilidad"), {"activa": True}, format="json")
            self.assertEqual(res.status_code, 200)
        self.client.force_authenticate(self.cliente)
        res = self.client.post(reverse("urgencias"), {
            "especialidad": self.e.pk, "zona": self.z.pk,
            "descripcion": "Prueba integral", "direccion": "Dirección ficticia",
        }, format="json")
        self.assertEqual(res.status_code, 201)
        urgencia_id = res.data["id"]
        primer_id = res.data["asignaciones"][0]["trabajo"]
        self.client.force_authenticate(self.tecnico)
        res = self.client.post(reverse("trabajo-estado", args=[primer_id]), {"estado": "cancelado"})
        self.assertEqual(res.status_code, 200)
        self.client.force_authenticate(self.cliente)
        pedido = self.client.get(reverse("urgencias")).data[0]
        self.assertEqual(pedido["id"], urgencia_id)
        self.assertEqual(pedido["estado"], "asignada")
        self.assertEqual(len(pedido["asignaciones"]), 2)
        segundo_id = pedido["asignaciones"][0]["trabajo"]
        self.assertNotEqual(segundo_id, primer_id)
        self.client.force_authenticate(otro)
        codigo = self.client.get(reverse("token-trabajo", args=[segundo_id])).data["token"]["codigo"]
        self.client.force_authenticate(self.cliente)
        res = self.client.post(reverse("token-validar", args=[segundo_id]), {"codigo": codigo})
        self.assertEqual(res.status_code, 200)
        self.client.force_authenticate(otro)
        res = self.client.post(reverse("trabajo-estado", args=[segundo_id]), {"estado": "finalizado"})
        self.assertEqual(res.status_code, 200)
        self.client.force_authenticate(self.cliente)
        self.assertEqual(self.client.get(reverse("urgencias")).data[0]["estado"], "finalizada")

    def test_cancelacion_cliente_por_api_detiene_reemplazos(self):
        self.disponible()
        u = services.crear(self.cliente, self.datos)
        trabajo = u.asignaciones.get().trabajo
        self.client.force_authenticate(self.cliente)
        res = self.client.post(reverse("urgencia-cancelar", args=[u.pk]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["estado"], "cancelada")
        otro = crear_tecnico("otro-cancelacion", [self.e], [self.z])
        self.disponible(otro)
        services.procesar_pendientes()
        self.assertEqual(u.asignaciones.count(), 1)
        self.assertEqual(TokenTrabajo.objects.get(trabajo=trabajo).estado, "cancelado")

    def test_catalogo_desactivado_no_recibe_reemplazo(self):
        otro = crear_tecnico("otro-catalogo", [self.e], [self.z])
        self.disponible(); self.disponible(otro)
        u = services.crear(self.cliente, self.datos)
        self.e.activa = False
        self.e.save()
        cambiar_estado_trabajo(u.asignaciones.get().trabajo, self.tecnico, "cancelado")
        u.refresh_from_db()
        self.assertEqual(u.estado, "buscando")
        self.assertEqual(u.asignaciones.count(), 1)

    def test_worker_asigna_sin_pantalla_abierta(self):
        u = services.crear(self.cliente, self.datos)
        Disponibilidad.objects.create(tecnico=self.tecnico, activa=True)
        services.procesar_pendientes()
        u.refresh_from_db()
        self.assertEqual(u.estado, "asignada")
        services.procesar_pendientes()
        self.assertEqual(u.asignaciones.count(), 1)


class ConcurrenciaTests(Escenario, TransactionTestCase):
    def test_dos_clientes_no_reservan_el_mismo_tecnico(self):
        self.preparar(); self.disponible()
        otro = crear_usuario("concurrente", "CLIENTE")
        barrera = Barrier(2)
        def pedir(usuario):
            close_old_connections()
            try:
                barrera.wait(timeout=10)
                return services.crear(usuario, self.datos).estado
            finally:
                close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as pool:
            resultados = list(pool.map(pedir, [self.cliente, otro]))
        self.assertCountEqual(resultados, ["asignada", "buscando"])
        self.assertEqual(Asignacion.objects.count(), 1)
