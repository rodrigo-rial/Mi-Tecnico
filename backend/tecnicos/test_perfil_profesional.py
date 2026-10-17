from rest_framework.test import APITestCase
from solicitudes.tests import crear_usuario, crear_tecnico
from tecnicos.models import Especialidad, Zona, PerfilTecnico


class PerfilProfesionalTests(APITestCase):
    def setUp(self):
        self.cliente = crear_usuario("lector", "CLIENTE")
        self.tecnico = crear_tecnico("profesional", [Especialidad.objects.first()], [Zona.objects.first()])
        self.url = f"/api/tecnicos/{self.tecnico.pk}/profesional/"
        self.client.force_authenticate(self.cliente)

    def test_perfil_solo_informacion_profesional(self):
        respuesta = self.client.get(self.url)
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(set(respuesta.data), {"id", "nombre", "descripcion", "especialidades", "zonas", "reputacion", "resenas", "fotos"})
        self.assertEqual(respuesta.data["reputacion"]["cantidad"], 0)
        self.assertEqual(respuesta.data["resenas"], [])

    def test_no_publica_pendientes(self):
        PerfilTecnico.objects.filter(usuario=self.tecnico).update(estado_validacion="PENDIENTE")
        self.assertEqual(self.client.get(self.url).status_code, 404)

    def test_no_publica_bloqueados(self):
        self.tecnico.is_active = False
        self.tecnico.save()
        self.assertEqual(self.client.get(self.url).status_code, 404)

    def test_requiere_sesion(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, 401)
