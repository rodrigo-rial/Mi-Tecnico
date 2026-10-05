from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from solicitudes.models import Solicitud, Propuesta
from tecnicos.models import Especialidad, PerfilTecnico, Zona

from decimal import Decimal
from datetime import date
from django.db import IntegrityError

User = get_user_model()


def crear_usuario(username, rol):
    return User.objects.create_user(
        username=username,
        email=f"{username}@test.com",
        password="Test12345!",
        rol=rol,
    )


def crear_tecnico(username, especialidades, zonas, estado="APROBADO"):
    tecnico = crear_usuario(username, "TECNICO")
    perfil, _ = PerfilTecnico.objects.get_or_create(usuario=tecnico)
    perfil.especialidades.set(especialidades)
    perfil.zonas.set(zonas)
    # update() evita save()/full_clean(), que exige documentos para aprobar.
    PerfilTecnico.objects.filter(pk=perfil.pk).update(estado_validacion=estado)
    # Se recarga el usuario para no arrastrar el perfil cacheado.
    return User.objects.get(pk=tecnico.pk)


class SolicitudBaseTest(TestCase):
    def setUp(self):
        self.electricidad, _ = Especialidad.objects.get_or_create(nombre="Electricidad")
        self.gas, _ = Especialidad.objects.get_or_create(nombre="Gas")
        self.tolosa, _ = Zona.objects.get_or_create(nombre="Tolosa")
        self.city_bell, _ = Zona.objects.get_or_create(nombre="City Bell")

        self.cliente = crear_usuario("cliente", "CLIENTE")
        self.otro_cliente = crear_usuario("otro", "CLIENTE")

    def nueva_solicitud(self, **kwargs):
        datos = dict(
            cliente=self.cliente,
            titulo="Tablero salta",
            descripcion="Salta la térmica",
            especialidad=self.electricidad,
            zona=self.tolosa,
            direccion="Calle 1 nro 100",
        )
        datos.update(kwargs)
        return Solicitud.objects.create(**datos)


class SolicitudModeloTests(SolicitudBaseTest):
    def test_valores_por_defecto(self):
        s = self.nueva_solicitud()
        self.assertEqual(s.estado, Solicitud.Estado.PUBLICADA)
        self.assertFalse(s.es_urgente)
        self.assertIsNotNone(s.created_at)

    def test_cliente_puede_crear_solicitud(self):
        s = Solicitud(
            cliente=self.cliente,
            titulo="x",
            descripcion="y",
            especialidad=self.electricidad,
            zona=self.tolosa,
            direccion="z",
        )
        s.full_clean()  # no debe lanzar error

    def test_tecnico_no_puede_crear_solicitud(self):
        tecnico = crear_tecnico("t1", [self.electricidad], [self.tolosa])
        s = Solicitud(
            cliente=tecnico,
            titulo="x",
            descripcion="y",
            especialidad=self.electricidad,
            zona=self.tolosa,
            direccion="z",
        )
        with self.assertRaises(ValidationError):
            s.full_clean()

    def test_estado_invalido_es_rechazado(self):
        s = Solicitud(
            cliente=self.cliente,
            titulo="x",
            descripcion="y",
            especialidad=self.electricidad,
            zona=self.tolosa,
            direccion="z",
            estado="inventado",
        )
        with self.assertRaises(ValidationError):
            s.full_clean()


class SolicitudCancelarTests(SolicitudBaseTest):
    def test_dueno_puede_cancelar(self):
        s = self.nueva_solicitud()
        s.cancelar(self.cliente)
        s.refresh_from_db()
        self.assertEqual(s.estado, Solicitud.Estado.CANCELADA)

    def test_no_dueno_no_puede_cancelar(self):
        s = self.nueva_solicitud()
        with self.assertRaises(ValidationError):
            s.cancelar(self.otro_cliente)
        s.refresh_from_db()
        self.assertEqual(s.estado, Solicitud.Estado.PUBLICADA)

    def test_no_se_cancela_una_asignada(self):
        s = self.nueva_solicitud(estado=Solicitud.Estado.ASIGNADA)
        with self.assertRaises(ValidationError):
            s.cancelar(self.cliente)

    def test_no_se_cancela_dos_veces(self):
        s = self.nueva_solicitud()
        s.cancelar(self.cliente)
        with self.assertRaises(ValidationError):
            s.cancelar(self.cliente)


class SolicitudCompatiblesTests(SolicitudBaseTest):
    def test_tecnico_ve_solo_compatibles(self):
        tecnico = crear_tecnico("t1", [self.electricidad], [self.tolosa])

        compatible = self.nueva_solicitud(titulo="compatible")
        self.nueva_solicitud(titulo="otra zona", zona=self.city_bell)
        self.nueva_solicitud(titulo="otra especialidad", especialidad=self.gas)
        self.nueva_solicitud(titulo="cancelada", estado=Solicitud.Estado.CANCELADA)
        self.nueva_solicitud(titulo="asignada", estado=Solicitud.Estado.ASIGNADA)

        self.assertEqual(list(Solicitud.compatibles_para(tecnico)), [compatible])

    def test_tecnico_con_varias_zonas(self):
        tecnico = crear_tecnico("t1", [self.electricidad], [self.tolosa, self.city_bell])
        self.nueva_solicitud(titulo="a")
        self.nueva_solicitud(titulo="b", zona=self.city_bell)
        self.assertEqual(Solicitud.compatibles_para(tecnico).count(), 2)

    def test_tecnico_con_varias_especialidades(self):
        tecnico = crear_tecnico("t1", [self.electricidad, self.gas], [self.tolosa])
        self.nueva_solicitud(titulo="elec")
        self.nueva_solicitud(titulo="gas", especialidad=self.gas)
        self.assertEqual(Solicitud.compatibles_para(tecnico).count(), 2)

    def test_tecnico_pendiente_no_ve_nada(self):
        tecnico = crear_tecnico("p1", [self.electricidad], [self.tolosa], estado="PENDIENTE")
        self.nueva_solicitud()
        self.assertEqual(Solicitud.compatibles_para(tecnico).count(), 0)

    def test_tecnico_rechazado_no_ve_nada(self):
        tecnico = crear_tecnico("r1", [self.electricidad], [self.tolosa], estado="RECHAZADO")
        self.nueva_solicitud()
        self.assertEqual(Solicitud.compatibles_para(tecnico).count(), 0)

    def test_cliente_no_ve_compatibles(self):
        self.nueva_solicitud()
        self.assertEqual(Solicitud.compatibles_para(self.cliente).count(), 0)

class SolicitudAPITests(APITestCase):
    def setUp(self):
        # 1. Zonas y Especialidades
        self.esp, _ = Especialidad.objects.get_or_create(nombre="Electricidad Test", defaults={"activa": True})
        self.esp_otra, _ = Especialidad.objects.get_or_create(nombre="Gas Test", defaults={"activa": True})
        self.zona, _ = Zona.objects.get_or_create(nombre="Tolosa Test", defaults={"activa": True})
        self.zona_otra, _ = Zona.objects.get_or_create(nombre="City Bell Test", defaults={"activa": True})

        # 2. Usuarios utilizando tus helpers
        self.cliente_1 = crear_usuario("api_cliente_1", "CLIENTE")
        self.cliente_2 = crear_usuario("api_cliente_2", "CLIENTE")
        self.tecnico = crear_tecnico("api_tecnico_1", [self.esp], [self.zona], estado="APROBADO")

        # 3. Solicitudes
        self.solicitud_cliente_1 = Solicitud.objects.create(
            cliente=self.cliente_1,
            titulo="Reparar canilla",
            descripcion="Pierde agua en la cocina",
            especialidad=self.esp,
            zona=self.zona,
            direccion="Calle 7 123",
            estado=Solicitud.Estado.PUBLICADA,
        )
        self.solicitud_cliente_2 = Solicitud.objects.create(
            cliente=self.cliente_2,
            titulo="Arreglo persiana",
            descripcion="No sube la persiana",
            especialidad=self.esp_otra,
            zona=self.zona_otra,
            direccion="Calle 50 456",
            estado=Solicitud.Estado.PUBLICADA,
        )

        self.solicitud_compatible = self.solicitud_cliente_1
        self.solicitud_no_compatible = self.solicitud_cliente_2

    def test_tecnico_recibe_403_al_crear(self):
        self.client.force_authenticate(user=self.tecnico)
        url = reverse("solicitud-list")
        data = {
            "titulo": "Prueba",
            "descripcion": "Descripción de prueba",
            "especialidad": self.esp.id,
            "zona": self.zona.id,
            "direccion": "Calle 1 100",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cliente_no_ve_solicitudes_ajenas(self):
        self.client.force_authenticate(user=self.cliente_1)
        url = reverse("solicitud-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data]
        self.assertIn(self.solicitud_cliente_1.id, ids)
        self.assertNotIn(self.solicitud_cliente_2.id, ids)

    def test_tecnico_solo_ve_compatibles(self):
        self.client.force_authenticate(user=self.tecnico)
        url = reverse("solicitud-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data]
        self.assertIn(self.solicitud_compatible.id, ids)
        self.assertNotIn(self.solicitud_no_compatible.id, ids)

    def test_no_dueno_no_puede_cancelar(self):
        self.client.force_authenticate(user=self.cliente_2)
        url = reverse("solicitud-cancelar", kwargs={"pk": self.solicitud_cliente_1.id})
        response = self.client.post(url)
        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND],
        )


class PropuestaModeloTests(SolicitudBaseTest):
    def setUp(self):
        super().setUp()
        self.tecnico_ok = crear_tecnico(
            "t_propuesta_ok", [self.electricidad], [self.tolosa], estado="APROBADO"
        )
        self.tecnico_pendiente = crear_tecnico(
            "t_propuesta_pend", [self.electricidad], [self.tolosa], estado="PENDIENTE"
        )
        self.tecnico_otra_zona = crear_tecnico(
            "t_propuesta_zona", [self.electricidad], [self.city_bell], estado="APROBADO"
        )
        self.solicitud = self.nueva_solicitud()

    def nueva_propuesta(self, **kwargs):
        datos = {
            "solicitud": self.solicitud,
            "tecnico": self.tecnico_ok,
            "precio": Decimal("1500.00"),
            "descripcion_solucion": "Reparación estándar de instalación",
            "fecha_disponible": date.today(),
        }
        datos.update(kwargs)
        return Propuesta(**datos)

    def test_tecnico_aprobado_y_compatible_pasa(self):
        p = self.nueva_propuesta()
        p.full_clean()
        p.save()
        self.assertEqual(Propuesta.objects.count(), 1)

    def test_tecnico_pendiente_o_rechazado_falla(self):
        p = self.nueva_propuesta(tecnico=self.tecnico_pendiente)
        with self.assertRaises(ValidationError):
            p.full_clean()

    def test_especialidad_o_zona_distinta_falla(self):
        p = self.nueva_propuesta(tecnico=self.tecnico_otra_zona)
        with self.assertRaises(ValidationError):
            p.full_clean()

    def test_propuesta_duplicada_integrity_error(self):
        p1 = self.nueva_propuesta()
        p1.save()
        with self.assertRaises(IntegrityError):
            p2 = self.nueva_propuesta(precio=Decimal("2000.00"))
            p2.save()

    def test_dos_propuestas_aceptadas_en_misma_solicitud_integrity_error(self):
        tecnico_2 = crear_tecnico(
            "t_propuesta_ok2", [self.electricidad], [self.tolosa], estado="APROBADO"
        )
        p1 = self.nueva_propuesta(estado=Propuesta.Estado.ACEPTADA)
        p1.save()

        with self.assertRaises(IntegrityError):
            p2 = self.nueva_propuesta(
                tecnico=tecnico_2,
                precio=Decimal("2000.00"),
                estado=Propuesta.Estado.ACEPTADA,
            )
            p2.save()

    def test_propuesta_sobre_solicitud_no_publicada_falla(self):
        solicitud_cancelada = self.nueva_solicitud(estado=Solicitud.Estado.CANCELADA)
        p = self.nueva_propuesta(solicitud=solicitud_cancelada)
        with self.assertRaises(ValidationError):
            p.full_clean()

class PropuestaAPITests(APITestCase, SolicitudBaseTest):
    def setUp(self):
        super().setUp()
        self.tecnico_ok = crear_tecnico(
            "t_api_ok", [self.electricidad], [self.tolosa], estado="APROBADO"
        )
        self.tecnico_pendiente = crear_tecnico(
            "t_api_pend", [self.electricidad], [self.tolosa], estado="PENDIENTE"
        )
        self.tecnico_otra_zona = crear_tecnico(
            "t_api_zona", [self.electricidad], [self.city_bell], estado="APROBADO"
        )
        self.cliente_ajeno = crear_usuario("cliente_ajeno", rol="CLIENTE")
        self.solicitud = self.nueva_solicitud()

        self.url_propuestas = f"/api/solicitudes/{self.solicitud.id}/propuestas/"
        self.payload = {
            "precio": "1500.00",
            "descripcion_solucion": "Reparación a domicilio",
            "fecha_disponible": str(date.today()),
        }

    def test_tecnico_pendiente_no_puede_enviar(self):
        self.client.force_authenticate(user=self.tecnico_pendiente)
        res = self.client.post(self.url_propuestas, self.payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_tecnico_incompatible_devuelve_400_o_403(self):
        self.client.force_authenticate(user=self.tecnico_otra_zona)
        res = self.client.post(self.url_propuestas, self.payload)
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

    def test_tecnico_aprobado_y_compatible_crea_propuesta(self):
        self.client.force_authenticate(user=self.tecnico_ok)
        res = self.client.post(self.url_propuestas, self.payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Propuesta.objects.filter(solicitud=self.solicitud).count(), 1)

    def test_propuesta_duplicada_devuelve_400(self):
        self.client.force_authenticate(user=self.tecnico_ok)
        # Primer envío OK
        res1 = self.client.post(self.url_propuestas, self.payload)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Segundo envío: duplicado
        res2 = self.client.post(self.url_propuestas, self.payload)
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cliente_ajeno_no_ve_las_propuestas(self):
        # Creamos una propuesta primero
        Propuesta.objects.create(
            solicitud=self.solicitud,
            tecnico=self.tecnico_ok,
            precio=Decimal("1500.00"),
            descripcion_solucion="Arreglo",
            fecha_disponible=date.today(),
        )
        self.client.force_authenticate(user=self.cliente_ajeno)
        res = self.client.get(self.url_propuestas)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cliente_dueno_si_ve_las_propuestas(self):
        Propuesta.objects.create(
            solicitud=self.solicitud,
            tecnico=self.tecnico_ok,
            precio=Decimal("1500.00"),
            descripcion_solucion="Arreglo",
            fecha_disponible=date.today(),
        )
        self.client.force_authenticate(user=self.cliente)
        res = self.client.get(self.url_propuestas)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_endpoint_propuestas_mias(self):
        Propuesta.objects.create(
            solicitud=self.solicitud,
            tecnico=self.tecnico_ok,
            precio=Decimal("1500.00"),
            descripcion_solucion="Arreglo",
            fecha_disponible=date.today(),
        )
        self.client.force_authenticate(user=self.tecnico_ok)
        res = self.client.get("/api/propuestas/mias/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)