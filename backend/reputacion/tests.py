from django.test import TestCase

import shutil
import tempfile
from datetime import date
from decimal import Decimal
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from solicitudes.models import Propuesta, Solicitud, Trabajo
from tecnicos.models import Especialidad, Zona

from reputacion.models import Calificacion, FotoTrabajo

User = get_user_model()
MEDIA_TEMPORAL = tempfile.mkdtemp()  # las fotos de los tests no ensucian /media


def crear_usuario(email, rol):
    username = email.split('@')[0]
    return User.objects.create_user(username=username, email=email, password="Clave12345!", rol=rol)


def crear_trabajo(cliente, tecnico, estado=Trabajo.Estado.FINALIZADO):
    especialidad, _ = Especialidad.objects.get_or_create(nombre="Plomería")
    zona, _ = Zona.objects.get_or_create(nombre="Centro")
    solicitud = Solicitud.objects.create(
        cliente=cliente, titulo="Pierde agua", descripcion="Caño roto",
        especialidad=especialidad, zona=zona, direccion="Calle 1 nro 100",
    )
    propuesta = Propuesta.objects.create(
        solicitud=solicitud, tecnico=tecnico, descripcion_solucion="Cambio de caño",
        precio=Decimal("1000"), fecha_disponible=date.today(),
        estado=Propuesta.Estado.ACEPTADA,
    )
    return Trabajo.objects.create(
        solicitud=solicitud, propuesta=propuesta, cliente=cliente, tecnico=tecnico,
        precio_acordado=Decimal("1000"), estado=estado,
    )


def imagen_de_prueba(nombre="foto.png", formato="PNG"):
    buffer = BytesIO()
    Image.new("RGB", (10, 10), "blue").save(buffer, formato)
    return SimpleUploadedFile(nombre, buffer.getvalue(), content_type="image/png")


class BaseReputacion(APITestCase):
    def setUp(self):
        self.cliente = crear_usuario("cliente@test.com", "CLIENTE")
        self.tecnico = crear_usuario("tecnico@test.com", "TECNICO")
        self.otro = crear_usuario("otro@test.com", "CLIENTE")
        self.trabajo = crear_trabajo(self.cliente, self.tecnico)

    def calificar(self, usuario, trabajo_id=None, puntaje=5, comentario="Muy bien"):
        self.client.force_authenticate(usuario)
        return self.client.post(
            "/api/calificaciones/",
            {"trabajo": trabajo_id or self.trabajo.id, "puntaje": puntaje, "comentario": comentario},
            format="json",
        )


class PruebasCalificaciones(BaseReputacion):
    def test_cliente_califica_al_tecnico(self):
        r = self.calificar(self.cliente)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["destinatario"], self.tecnico.id)

    def test_tecnico_califica_al_cliente(self):
        r = self.calificar(self.tecnico, puntaje=4)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["destinatario"], self.cliente.id)

    def test_no_se_puede_calificar_trabajo_no_finalizado(self):
        trabajo = crear_trabajo(self.cliente, self.tecnico, estado=Trabajo.Estado.EN_PROCESO)
        self.assertEqual(self.calificar(self.cliente, trabajo.id).status_code, 400)

    def test_no_se_puede_calificar_dos_veces(self):
        self.calificar(self.cliente)
        self.assertEqual(self.calificar(self.cliente).status_code, 400)
        self.assertEqual(Calificacion.objects.count(), 1)

    def test_no_participante_recibe_403(self):
        self.assertEqual(self.calificar(self.otro).status_code, 403)

    def test_puntaje_fuera_de_rango(self):
        self.assertEqual(self.calificar(self.cliente, puntaje=6).status_code, 400)
        self.assertEqual(self.calificar(self.cliente, puntaje=0).status_code, 400)

    def test_sin_token_recibe_401(self):
        self.client.force_authenticate(None)
        r = self.client.post("/api/calificaciones/", {"trabajo": self.trabajo.id, "puntaje": 5}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_no_se_califica_a_si_mismo(self):
        # Dato inconsistente armado a propósito: mismo usuario en ambos roles
        trabajo = crear_trabajo(self.cliente, self.cliente)
        self.assertEqual(self.calificar(self.cliente, trabajo.id).status_code, 400)

    def test_solo_participantes_ven_las_calificaciones_del_trabajo(self):
        self.calificar(self.cliente)
        self.client.force_authenticate(self.otro)
        self.assertEqual(self.client.get(f"/api/trabajos/{self.trabajo.id}/calificaciones/").status_code, 403)
        self.client.force_authenticate(self.tecnico)
        r = self.client.get(f"/api/trabajos/{self.trabajo.id}/calificaciones/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)


class PruebasPromedio(BaseReputacion):
    def test_promedio_y_cantidad_recibidos(self):
        self.calificar(self.cliente, puntaje=5)
        segundo = crear_trabajo(self.otro, self.tecnico)
        self.calificar(self.otro, segundo.id, puntaje=3)
        self.client.force_authenticate(self.cliente)
        r = self.client.get(f"/api/usuarios/{self.tecnico.id}/reputacion/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["promedio"], 4.0)
        self.assertEqual(r.data["cantidad"], 2)

    def test_usuario_sin_calificaciones(self):
        self.client.force_authenticate(self.cliente)
        r = self.client.get(f"/api/usuarios/{self.tecnico.id}/reputacion/")
        self.assertIsNone(r.data["promedio"])
        self.assertEqual(r.data["cantidad"], 0)


@override_settings(MEDIA_ROOT=MEDIA_TEMPORAL)
class PruebasFotos(BaseReputacion):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TEMPORAL, ignore_errors=True)

    def subir(self, usuario, trabajo_id=None, imagen=None):
        self.client.force_authenticate(usuario)
        return self.client.post(
            f"/api/trabajos/{trabajo_id or self.trabajo.id}/fotos/",
            {"imagen": imagen or imagen_de_prueba(), "descripcion": "Listo"},
            format="multipart",
        )

    def test_tecnico_sube_foto(self):
        r = self.subir(self.tecnico)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(FotoTrabajo.objects.filter(trabajo=self.trabajo).count(), 1)

    def test_cliente_no_puede_subir_fotos(self):
        self.assertEqual(self.subir(self.cliente).status_code, 403)

    def test_trabajo_no_finalizado_rechaza_fotos(self):
        trabajo = crear_trabajo(self.cliente, self.tecnico, estado=Trabajo.Estado.EN_PROCESO)
        self.assertEqual(self.subir(self.tecnico, trabajo.id).status_code, 400)

    def test_limite_de_fotos_por_trabajo(self):
        for _ in range(5):
            self.assertEqual(self.subir(self.tecnico).status_code, 201)
        self.assertEqual(self.subir(self.tecnico).status_code, 400)

    def test_archivo_que_no_es_imagen(self):
        falso = SimpleUploadedFile("virus.png", b"no soy una imagen", content_type="image/png")
        self.assertEqual(self.subir(self.tecnico, imagen=falso).status_code, 400)

    def test_historial_del_tecnico(self):
        self.subir(self.tecnico)
        self.client.force_authenticate(self.cliente)
        r = self.client.get(f"/api/tecnicos/{self.tecnico.id}/fotos/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)

class ArchivosPublicosIntegracionTests(TestCase):
    """Las fotos del historial no deben publicar los documentos privados."""

    def test_rutas_publicas_limitadas_a_fotos(self):
        import importlib
        from pathlib import Path
        from django.core.exceptions import SuspiciousFileOperation
        from django.test import RequestFactory
        from django.urls import Resolver404, clear_url_caches, resolve
        import config.urls

        with tempfile.TemporaryDirectory() as directorio:
            raiz = Path(directorio)
            (raiz / "trabajos").mkdir()
            (raiz / "tecnicos").mkdir()
            (raiz / "trabajos" / "ejemplo.png").write_bytes(b"foto de prueba")
            (raiz / "tecnicos" / "dni.pdf").write_bytes(b"documento privado")
            try:
                with override_settings(DEBUG=True, MEDIA_ROOT=raiz):
                    importlib.reload(config.urls)
                    clear_url_caches()
                    ruta = resolve("/media/trabajos/ejemplo.png")
                    respuesta = ruta.func(RequestFactory().get("/media/trabajos/ejemplo.png"), **ruta.kwargs)
                    try:
                        self.assertEqual(b"".join(respuesta.streaming_content), b"foto de prueba")
                    finally:
                        respuesta.close()
                    with self.assertRaises(Resolver404):
                        resolve("/media/tecnicos/dni.pdf")
                    with self.assertRaises(SuspiciousFileOperation):
                        ruta.func(RequestFactory().get("/"), path="../tecnicos/dni.pdf", document_root=raiz / "trabajos")
            finally:
                importlib.reload(config.urls)
                clear_url_caches()
