from io import BytesIO
from tempfile import TemporaryDirectory
from PIL import Image
from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from .models import Usuario


def foto():
    salida = BytesIO()
    Image.new("RGB", (30, 20), "blue").save(salida, "PNG")
    return SimpleUploadedFile("foto.png", salida.getvalue(), content_type="image/png")


class FotoPerfilTests(APITestCase):
    def setUp(self):
        carpeta = TemporaryDirectory()
        self.addCleanup(carpeta.cleanup)
        ajustes = override_settings(MEDIA_ROOT=carpeta.name)
        ajustes.enable()
        self.addCleanup(ajustes.disable)
        self.usuario = Usuario.objects.create_user(username="foto", email="foto@example.com", password="Prueba12345!")
        self.otro = Usuario.objects.create_user(username="otro-foto", email="otro-foto@example.com", password="Prueba12345!")
        self.client.force_authenticate(self.usuario)

    def subir(self):
        return self.client.post("/api/usuarios/actual/foto/", {"imagen": foto()}, format="multipart")

    def test_cargar_reemplazar_y_quitar(self):
        primera = self.subir()
        self.assertEqual(primera.status_code, 200)
        segunda = self.subir()
        self.assertEqual(segunda.status_code, 200)
        self.assertNotEqual(primera.data, segunda.data)
        respuesta = self.client.get("/api" + segunda.data["foto_perfil"])
        self.assertEqual(respuesta.status_code, 200)
        with Image.open(BytesIO(b"".join(respuesta.streaming_content))) as imagen:
            self.assertEqual(imagen.size, (512, 512))
            self.assertEqual(imagen.format, "JPEG")
        self.assertEqual(self.client.delete("/api/usuarios/actual/foto/").data, {"foto_perfil": None})
        self.assertEqual(self.client.get(f"/api/usuarios/{self.usuario.pk}/foto/").status_code, 404)

    def test_archivo_invalido_no_modifica_foto(self):
        self.subir()
        self.usuario.refresh_from_db()
        anterior = self.usuario.foto_perfil.name
        respuesta = self.client.post("/api/usuarios/actual/foto/", {"imagen": SimpleUploadedFile("falsa.png", b"texto")}, format="multipart")
        self.assertEqual(respuesta.status_code, 400)
        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.foto_perfil.name, anterior)

    def test_foto_cliente_no_visible_a_otros(self):
        self.subir()
        self.client.force_authenticate(self.otro)
        self.assertEqual(self.client.get(f"/api/usuarios/{self.usuario.pk}/foto/").status_code, 404)

    def test_sin_sesion_no_sube(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.subir().status_code, 401)

    def test_otro_usuario_no_puede_reemplazar_foto_por_id(self):
        respuesta = self.client.post("/api/usuarios/actual/foto/", {"imagen": foto(), "id": self.otro.pk}, format="multipart")
        self.assertEqual(respuesta.status_code, 200)
        self.otro.refresh_from_db()
        self.assertFalse(self.otro.foto_perfil)
