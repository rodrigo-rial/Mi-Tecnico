import tempfile
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework.test import APITestCase

from reputacion import services
from reputacion.models import MAX_FOTOS_POR_TRABAJO
from solicitudes.models import Trabajo

from .helpers import crear_trabajo, crear_usuario


def imagen_de_prueba(nombre="foto.png"):
    buffer = BytesIO()
    Image.new("RGB", (10, 10), "blue").save(buffer, format="PNG")
    return SimpleUploadedFile(nombre, buffer.getvalue(), content_type="image/png")


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FotosTests(APITestCase):
    def setUp(self):
        self.trabajo = crear_trabajo()
        self.url = reverse("fotos-trabajo", args=[self.trabajo.pk])

    def test_tecnico_sube_foto(self):
        self.client.force_authenticate(self.trabajo.tecnico)
        r = self.client.post(
            self.url,
            {"imagen": imagen_de_prueba(), "descripcion": "Listo"},
            format="multipart",
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["trabajo"], self.trabajo.pk)

    def test_participantes_ven_la_galeria(self):
        services.subir_foto(self.trabajo, self.trabajo.tecnico, imagen_de_prueba())
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)

    def test_historial_del_tecnico(self):
        services.subir_foto(self.trabajo, self.trabajo.tecnico, imagen_de_prueba())
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.get(reverse("fotos-usuario", args=[self.trabajo.tecnico_id]))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)

    def test_cliente_no_puede_subir(self):
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.post(self.url, {"imagen": imagen_de_prueba()}, format="multipart")
        self.assertEqual(r.status_code, 403)

    def test_trabajo_no_finalizado_rechaza(self):
        self.trabajo.estado = Trabajo.Estado.EN_PROCESO
        self.trabajo.save()
        self.client.force_authenticate(self.trabajo.tecnico)
        r = self.client.post(self.url, {"imagen": imagen_de_prueba()}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_limite_de_fotos(self):
        for i in range(MAX_FOTOS_POR_TRABAJO):
            services.subir_foto(self.trabajo, self.trabajo.tecnico, imagen_de_prueba(f"f{i}.png"))
        self.client.force_authenticate(self.trabajo.tecnico)
        r = self.client.post(self.url, {"imagen": imagen_de_prueba()}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_archivo_que_no_es_imagen(self):
        self.client.force_authenticate(self.trabajo.tecnico)
        falso = SimpleUploadedFile("a.txt", b"hola", content_type="text/plain")
        r = self.client.post(self.url, {"imagen": falso}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_tercero_no_ve_la_galeria(self):
        self.client.force_authenticate(crear_usuario("tercero@test.com", "CLIENTE"))
        self.assertEqual(self.client.get(self.url).status_code, 403)
