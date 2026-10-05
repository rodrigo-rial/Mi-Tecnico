from datetime import date
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from solicitudes import services
from solicitudes.models import Propuesta, Solicitud, Trabajo
from solicitudes.tests import crear_tecnico, crear_usuario
from tecnicos.models import Especialidad, Zona


class EscenarioBase:
    """Cliente con una solicitud publicada y dos propuestas pendientes."""

    def crear_escenario(self):
        self.electricidad, _ = Especialidad.objects.get_or_create(nombre="Electricidad")
        self.tolosa, _ = Zona.objects.get_or_create(nombre="Tolosa")

        self.cliente = crear_usuario("cliente", "CLIENTE")
        self.otro_cliente = crear_usuario("otro", "CLIENTE")
        self.tecnico1 = crear_tecnico("tec1", [self.electricidad], [self.tolosa])
        self.tecnico2 = crear_tecnico("tec2", [self.electricidad], [self.tolosa])

        self.solicitud = Solicitud.objects.create(
            cliente=self.cliente,
            titulo="Tablero salta",
            descripcion="Salta la térmica",
            especialidad=self.electricidad,
            zona=self.tolosa,
            direccion="Calle 1 nro 100",
        )
        self.propuesta1 = self.nueva_propuesta(self.tecnico1, "1500.00")
        self.propuesta2 = self.nueva_propuesta(self.tecnico2, "2000.00")

    def nueva_propuesta(self, tecnico, precio):
        return Propuesta.objects.create(
            solicitud=self.solicitud,
            tecnico=tecnico,
            descripcion_solucion="Cambio de térmica",
            precio=Decimal(precio),
            fecha_disponible=date.today(),
        )


class TrabajoModeloTests(EscenarioBase, TestCase):
    def setUp(self):
        self.crear_escenario()
        self.trabajo = Trabajo.objects.create(
            solicitud=self.solicitud,
            propuesta=self.propuesta1,
            cliente=self.cliente,
            tecnico=self.tecnico1,
            precio_acordado=self.propuesta1.precio,
        )

    def test_comienza_pendiente(self):
        self.assertEqual(self.trabajo.estado, Trabajo.Estado.PENDIENTE)

    def test_flujo_valido(self):
        self.trabajo.cambiar_estado(Trabajo.Estado.EN_PROCESO)
        self.trabajo.cambiar_estado(Trabajo.Estado.FINALIZADO)
        self.trabajo.refresh_from_db()
        self.assertEqual(self.trabajo.estado, Trabajo.Estado.FINALIZADO)

    def test_no_se_puede_saltar_estados(self):
        with self.assertRaises(ValidationError):
            self.trabajo.cambiar_estado(Trabajo.Estado.FINALIZADO)

    def test_finalizado_es_terminal(self):
        self.trabajo.cambiar_estado(Trabajo.Estado.EN_PROCESO)
        self.trabajo.cambiar_estado(Trabajo.Estado.FINALIZADO)
        with self.assertRaises(ValidationError):
            self.trabajo.cambiar_estado(Trabajo.Estado.CANCELADO)

    def test_estado_inexistente(self):
        with self.assertRaises(ValidationError):
            self.trabajo.cambiar_estado("inventado")

    def test_cliente_debe_ser_el_de_la_solicitud(self):
        trabajo = Trabajo(
            solicitud=self.solicitud,
            propuesta=self.propuesta2,
            cliente=self.otro_cliente,
            tecnico=self.tecnico2,
            precio_acordado=Decimal("1.00"),
        )
        with self.assertRaises(ValidationError):
            trabajo.full_clean()

    def test_propuesta_debe_ser_de_la_solicitud(self):
        otra = Solicitud.objects.create(
            cliente=self.cliente,
            titulo="Otra",
            descripcion="x",
            especialidad=self.electricidad,
            zona=self.tolosa,
            direccion="Calle 2",
        )
        trabajo = Trabajo(
            solicitud=otra,
            propuesta=self.propuesta2,
            cliente=self.cliente,
            tecnico=self.tecnico2,
            precio_acordado=Decimal("1.00"),
        )
        with self.assertRaises(ValidationError):
            trabajo.full_clean()


class AceptarPropuestaAPITests(EscenarioBase, APITestCase):
    def setUp(self):
        self.crear_escenario()

    def url_aceptar(self, propuesta):
        return reverse("propuesta-aceptar", kwargs={"pk": propuesta.pk})

    def url_rechazar(self, propuesta):
        return reverse("propuesta-rechazar", kwargs={"pk": propuesta.pk})

    def test_aceptar_cambia_todo_y_crea_trabajo(self):
        self.client.force_authenticate(self.cliente)
        res = self.client.post(self.url_aceptar(self.propuesta1))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.propuesta1.refresh_from_db()
        self.propuesta2.refresh_from_db()
        self.solicitud.refresh_from_db()
        self.assertEqual(self.propuesta1.estado, Propuesta.Estado.ACEPTADA)
        self.assertEqual(self.propuesta2.estado, Propuesta.Estado.RECHAZADA)
        self.assertEqual(self.solicitud.estado, Solicitud.Estado.ASIGNADA)

        trabajo = Trabajo.objects.get(solicitud=self.solicitud)
        self.assertEqual(trabajo.cliente, self.cliente)
        self.assertEqual(trabajo.tecnico, self.tecnico1)
        self.assertEqual(trabajo.precio_acordado, Decimal("1500.00"))
        self.assertEqual(trabajo.estado, Trabajo.Estado.PENDIENTE)
        self.assertEqual(res.data["id"], trabajo.id)

    def test_otro_cliente_no_puede_aceptar(self):
        self.client.force_authenticate(self.otro_cliente)
        res = self.client.post(self.url_aceptar(self.propuesta1))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Trabajo.objects.count(), 0)

    def test_tecnico_no_puede_aceptar(self):
        self.client.force_authenticate(self.tecnico1)
        res = self.client.post(self.url_aceptar(self.propuesta1))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Trabajo.objects.count(), 0)

    def test_sin_autenticar(self):
        res = self.client.post(self.url_aceptar(self.propuesta1))
        self.assertIn(
            res.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_no_se_acepta_dos_veces(self):
        self.client.force_authenticate(self.cliente)
        self.client.post(self.url_aceptar(self.propuesta1))

        misma = self.client.post(self.url_aceptar(self.propuesta1))
        otra = self.client.post(self.url_aceptar(self.propuesta2))
        self.assertEqual(misma.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(otra.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Trabajo.objects.count(), 1)
        self.assertEqual(
            Propuesta.objects.filter(estado=Propuesta.Estado.ACEPTADA).count(), 1
        )

    def test_no_se_acepta_en_solicitud_cancelada(self):
        self.solicitud.cancelar(self.cliente)
        self.client.force_authenticate(self.cliente)
        res = self.client.post(self.url_aceptar(self.propuesta1))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Trabajo.objects.count(), 0)

    def test_servicio_es_atomico_si_falla_el_trabajo(self):
        # Una propuesta con precio inválido hace fallar full_clean() del
        # Trabajo: nada de lo anterior debe quedar guardado.
        Propuesta.objects.filter(pk=self.propuesta1.pk).update(precio=Decimal("0"))
        with self.assertRaises(ValidationError):
            services.aceptar_propuesta(self.propuesta1, self.cliente)
        self.propuesta1.refresh_from_db()
        self.propuesta2.refresh_from_db()
        self.solicitud.refresh_from_db()
        self.assertEqual(self.propuesta1.estado, Propuesta.Estado.PENDIENTE)
        self.assertEqual(self.propuesta2.estado, Propuesta.Estado.PENDIENTE)
        self.assertEqual(self.solicitud.estado, Solicitud.Estado.PUBLICADA)

    def test_rechazar_una_propuesta(self):
        self.client.force_authenticate(self.cliente)
        res = self.client.post(self.url_rechazar(self.propuesta1))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.propuesta1.refresh_from_db()
        self.solicitud.refresh_from_db()
        self.assertEqual(self.propuesta1.estado, Propuesta.Estado.RECHAZADA)
        self.assertEqual(self.solicitud.estado, Solicitud.Estado.PUBLICADA)

    def test_rechazar_dos_veces_falla(self):
        self.client.force_authenticate(self.cliente)
        self.client.post(self.url_rechazar(self.propuesta1))
        res = self.client.post(self.url_rechazar(self.propuesta1))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_otro_cliente_no_puede_rechazar(self):
        self.client.force_authenticate(self.otro_cliente)
        res = self.client.post(self.url_rechazar(self.propuesta1))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_no_se_acepta_una_propuesta_rechazada(self):
        self.client.force_authenticate(self.cliente)
        self.client.post(self.url_rechazar(self.propuesta1))
        res = self.client.post(self.url_aceptar(self.propuesta1))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)



class TrabajoAPITests(EscenarioBase, APITestCase):
    def setUp(self):
        self.crear_escenario()
        self.trabajo = services.aceptar_propuesta(self.propuesta1, self.cliente)
        self.tercero = crear_usuario("tercero", "CLIENTE")

    def url_estado(self):
        return reverse("trabajo-estado", kwargs={"pk": self.trabajo.pk})

    def cambiar(self, usuario, estado):
        self.client.force_authenticate(usuario)
        return self.client.post(self.url_estado(), {"estado": estado}, format="json")

    def test_cliente_y_tecnico_ven_el_trabajo(self):
        for usuario in (self.cliente, self.tecnico1):
            self.client.force_authenticate(usuario)
            res = self.client.get(reverse("trabajo-list"))
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            datos = res.data["results"] if isinstance(res.data, dict) else res.data
            self.assertEqual([t["id"] for t in datos], [self.trabajo.id])

    def test_detalle_incluye_datos_para_seguimiento(self):
        self.client.force_authenticate(self.tecnico1)
        res = self.client.get(reverse("trabajo-detail", kwargs={"pk": self.trabajo.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["direccion"], "Calle 1 nro 100")
        self.assertEqual(res.data["estado"], "pendiente")
        self.assertEqual(res.data["precio_acordado"], "1500.00")

    def test_tercero_no_ve_ni_accede(self):
        self.client.force_authenticate(self.tercero)
        lista = self.client.get(reverse("trabajo-list"))
        datos = lista.data["results"] if isinstance(lista.data, dict) else lista.data
        self.assertEqual(datos, [])
        detalle = self.client.get(
            reverse("trabajo-detail", kwargs={"pk": self.trabajo.pk})
        )
        self.assertEqual(detalle.status_code, status.HTTP_404_NOT_FOUND)

    def test_tecnico_con_propuesta_rechazada_no_ve_el_trabajo(self):
        self.client.force_authenticate(self.tecnico2)
        res = self.client.get(reverse("trabajo-detail", kwargs={"pk": self.trabajo.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_flujo_completo_tecnico(self):
        res = self.cambiar(self.tecnico1, "en_proceso")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["estado"], "en_proceso")

        res = self.cambiar(self.tecnico1, "finalizado")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.solicitud.refresh_from_db()
        self.assertEqual(self.solicitud.estado, Solicitud.Estado.FINALIZADA)

    def test_cliente_no_puede_iniciar_ni_finalizar(self):
        for estado in ("en_proceso", "finalizado"):
            res = self.cambiar(self.cliente, estado)
            self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.trabajo.refresh_from_db()
        self.assertEqual(self.trabajo.estado, Trabajo.Estado.PENDIENTE)

    def test_tercero_no_puede_cambiar_estado(self):
        res = self.cambiar(self.tercero, "en_proceso")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_no_se_salta_estados(self):
        res = self.cambiar(self.tecnico1, "finalizado")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.trabajo.refresh_from_db()
        self.assertEqual(self.trabajo.estado, Trabajo.Estado.PENDIENTE)

    def test_estado_invalido(self):
        res = self.cambiar(self.tecnico1, "inventado")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cliente_puede_cancelar_y_cierra_la_solicitud(self):
        res = self.cambiar(self.cliente, "cancelado")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.solicitud.refresh_from_db()
        self.assertEqual(self.solicitud.estado, Solicitud.Estado.CANCELADA)

    def test_tecnico_puede_cancelar(self):
        res = self.cambiar(self.tecnico1, "cancelado")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_no_se_cancela_un_trabajo_finalizado(self):
        self.cambiar(self.tecnico1, "en_proceso")
        self.cambiar(self.tecnico1, "finalizado")
        res = self.cambiar(self.cliente, "cancelado")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.solicitud.refresh_from_db()
        self.assertEqual(self.solicitud.estado, Solicitud.Estado.FINALIZADA)