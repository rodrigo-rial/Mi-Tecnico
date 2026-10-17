"""Recorrido entre módulos por las API, sin modificar los datos de desarrollo."""
from datetime import date
from io import BytesIO
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework.test import APITestCase

from solicitudes.tests import crear_usuario, crear_tecnico
from tecnicos.models import Especialidad, Zona


def foto():
    contenido = BytesIO()
    Image.new("RGB", (8, 8), "blue").save(contenido, "PNG")
    return SimpleUploadedFile("prueba.png", contenido.getvalue(), content_type="image/png")


class RecorridoIntegradoTests(APITestCase):
    def setUp(self):
        carpeta = TemporaryDirectory()
        self.addCleanup(carpeta.cleanup)
        ajustes = override_settings(MEDIA_ROOT=carpeta.name)
        ajustes.enable()
        self.addCleanup(ajustes.disable)
        self.cliente = crear_usuario("recorrido_cliente", "CLIENTE")
        self.otro = crear_usuario("recorrido_otro", "CLIENTE")
        self.especialidad = Especialidad.objects.get(nombre="Electricidad")
        self.zona = Zona.objects.get(nombre="Tolosa")
        self.tecnico = crear_tecnico("recorrido_tecnico", [self.especialidad], [self.zona])

    def enviar(self, usuario, ruta, datos, esperado=200, formato="json"):
        self.client.force_authenticate(usuario)
        respuesta = self.client.post(ruta, datos, format=formato)
        self.assertEqual(respuesta.status_code, esperado, respuesta.data)
        return respuesta.data

    def test_publicar_con_foto_hasta_calificar_y_subir_resultado(self):
        solicitud = self.enviar(self.cliente, reverse("solicitud-list"), {
            "titulo": "Reparar tablero", "descripcion": "Salta la térmica",
            "especialidad": self.especialidad.pk, "zona": self.zona.pk,
            "direccion": "Calle de prueba 123", "imagenes": [foto()],
        }, 201, "multipart")
        ruta_foto = reverse("foto-solicitud", args=[solicitud["id"], solicitud["fotos"][0]])
        self.client.force_authenticate(self.tecnico)
        respuesta = self.client.get(ruta_foto)
        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(b"".join(respuesta.streaming_content))
        propuesta = self.enviar(self.tecnico, reverse("solicitud-propuestas", args=[solicitud["id"]]), {
            "descripcion_solucion": "Revisar el tablero", "precio": "40000.00",
            "fecha_disponible": date.today().isoformat(),
        }, 201)
        trabajo = self.enviar(self.cliente, reverse("propuesta-aceptar", args=[propuesta["id"]]), {}, 201)
        trabajo_id = trabajo["id"]
        estado = reverse("trabajo-estado", args=[trabajo_id])
        self.enviar(self.tecnico, estado, {"estado": "en_proceso"}, 400)
        self.enviar(self.cliente, "/api/calificaciones/", {"trabajo": trabajo_id, "puntaje": 5}, 400)
        self.client.force_authenticate(self.otro)
        self.assertEqual(self.client.get(reverse("trabajo-detail", args=[trabajo_id])).status_code, 404)
        self.assertEqual(self.client.get(ruta_foto).status_code, 404)
        self.client.force_authenticate(self.tecnico)
        token = self.client.get(reverse("token-trabajo", args=[trabajo_id]))
        self.assertEqual(token.status_code, 200)
        self.enviar(self.cliente, reverse("token-validar", args=[trabajo_id]), {"codigo": token.data["token"]["codigo"]})
        finalizado = self.enviar(self.tecnico, estado, {"estado": "finalizado"})
        self.assertEqual(finalizado["estado"], "finalizado")
        for usuario, puntaje in [(self.cliente, 5), (self.tecnico, 4)]:
            self.enviar(usuario, "/api/calificaciones/", {"trabajo": trabajo_id, "puntaje": puntaje}, 201)
        self.enviar(self.cliente, "/api/calificaciones/", {"trabajo": trabajo_id, "puntaje": 5}, 400)
        self.enviar(self.tecnico, f"/api/trabajos/{trabajo_id}/fotos/", {"imagen": foto(), "descripcion": "Reparación terminada"}, 201, "multipart")
        self.client.force_authenticate(self.cliente)
        reputacion = self.client.get(f"/api/usuarios/{self.tecnico.pk}/reputacion/")
        self.assertEqual(reputacion.status_code, 200)
        self.assertEqual(reputacion.data["cantidad"], 1)
        self.assertEqual(reputacion.data["promedio"], 5)
        detalle = self.client.get(reverse("solicitud-detail", args=[solicitud["id"]]))
        self.assertEqual(detalle.data["estado"], "finalizada")
        galeria = self.client.get(f"/api/trabajos/{trabajo_id}/fotos/")
        self.assertEqual(galeria.status_code, 200)
        self.assertEqual(len(galeria.data), 1)
        self.enviar(self.cliente, estado, {"estado": "cancelado"}, 400)
