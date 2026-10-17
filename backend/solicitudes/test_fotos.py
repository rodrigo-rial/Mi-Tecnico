import tempfile
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase
from usuarios.models import Usuario
from tecnicos.models import PerfilTecnico, Especialidad, Zona
from .models import Solicitud, FotoSolicitud


def foto(formato="PNG"):
    salida = BytesIO()
    Image.new("RGB", (12, 12), "blue").save(salida, formato)
    return SimpleUploadedFile("foto." + formato.lower(), salida.getvalue(), content_type="image/" + formato.lower())


class FotosSolicitudTests(APITestCase):
    def setUp(self):
        self.temporal = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporal.cleanup)
        self.config = override_settings(MEDIA_ROOT=self.temporal.name)
        self.config.enable()
        self.addCleanup(self.config.disable)
        self.cliente = Usuario.objects.create_user(username="cliente", email="cliente@example.com", password="Prueba12345")
        self.otro = Usuario.objects.create_user(username="otro", email="otro@example.com", password="Prueba12345")
        self.tecnico = Usuario.objects.create_user(username="tecnico", email="tecnico@example.com", password="Prueba12345", rol="TECNICO")
        self.especialidad = Especialidad.objects.filter(activa=True).first()
        self.zona = Zona.objects.filter(activa=True).first()
        perfil = PerfilTecnico.objects.create(usuario=self.tecnico, estado_validacion="APROBADO", dni_numero="12345678", matricula_numero="MAT123", documento_dni=foto(), documento_matricula=foto())
        perfil.especialidades.add(self.especialidad)
        perfil.zonas.add(self.zona)
        self.datos = {"titulo": "Prueba", "descripcion": "Problema", "direccion": "Direccion de prueba", "especialidad": self.especialidad.pk, "zona": self.zona.pk}
        self.client.force_authenticate(self.cliente)

    def publicar(self, fotos=None):
        datos = self.datos.copy()
        if fotos is not None:
            datos["imagenes"] = fotos
        return self.client.post("/api/solicitudes/", datos, format="multipart")

    def test_crea_con_fotos_y_permite_consulta_autorizada(self):
        r = self.publicar([foto(), foto()])
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(len(r.data["fotos"]), 2)
        ruta = f'/api/solicitudes/{r.data["id"]}/fotos/{r.data["fotos"][0]}/'
        for usuario in (self.cliente, self.tecnico):
            self.client.force_authenticate(usuario)
            respuesta = self.client.get(ruta)
            self.assertEqual(respuesta.status_code, 200)
            self.assertTrue(b"".join(respuesta.streaming_content))
        self.client.force_authenticate(self.otro)
        self.assertEqual(self.client.get(ruta).status_code, 404)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(ruta).status_code, 401)

    def test_acepta_sin_fotos(self):
        self.assertEqual(self.publicar().status_code, 201)
        self.assertEqual(FotoSolicitud.objects.count(), 0)

    def test_archivo_falso_no_crea_solicitud(self):
        r = self.publicar([SimpleUploadedFile("falso.png", b"no es imagen", content_type="image/png")])
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Solicitud.objects.count(), 0)

    def test_rechaza_mas_de_cinco(self):
        self.assertEqual(self.publicar([foto() for _ in range(6)]).status_code, 400)
        self.assertEqual(Solicitud.objects.count(), 0)

    def test_rechaza_gif(self):
        self.assertEqual(self.publicar([foto("GIF")]).status_code, 400)

    def test_rechaza_archivo_grande(self):
        archivo = foto()
        archivo = SimpleUploadedFile("grande.png", archivo.read() + b"x" * (5 * 1024 * 1024), content_type="image/png")
        self.assertEqual(self.publicar([archivo]).status_code, 400)

    def test_no_publica_imagen_por_url_directa(self):
        self.publicar([foto()])
        imagen = FotoSolicitud.objects.get().imagen
        self.assertEqual(self.client.get(imagen.url).status_code, 404)

    def test_tecnico_no_compatible_no_ve_foto(self):
        r = self.publicar([foto()])
        self.tecnico.perfil_tecnico.zonas.clear()
        self.client.force_authenticate(self.tecnico)
        ruta = f'/api/solicitudes/{r.data["id"]}/fotos/{r.data["fotos"][0]}/'
        self.assertEqual(self.client.get(ruta).status_code, 404)
