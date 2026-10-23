"""El bloqueo administrativo debe invalidar el acceso con JWT existentes."""
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


class BloqueoCuentaTests(APITestCase):
    def setUp(self):
        self.usuario = get_user_model().objects.create_user(
            username="bloqueo_prueba", email="bloqueo@example.com",
            password="ClavePrueba123!", rol="CLIENTE",
        )
        respuesta = self.client.post("/api/token/", {
            "username": "bloqueo_prueba", "password": "ClavePrueba123!",
        }, format="json")
        self.assertEqual(respuesta.status_code, 200)
        self.tokens = respuesta.data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access']}")

    def bloquear(self):
        self.usuario.is_active = False
        self.usuario.save(update_fields=["is_active"])

    def test_bloqueo_rechaza_token_previamente_emitido(self):
        self.assertEqual(self.client.get("/api/usuarios/actual/").status_code, 200)
        self.bloquear()
        for ruta in ["/api/usuarios/actual/", "/api/solicitudes/", "/api/trabajos/", "/api/tecnicos/especialidades/"]:
            with self.subTest(ruta=ruta):
                self.assertEqual(self.client.get(ruta).status_code, 401)
        self.assertEqual(self.client.post("/api/solicitudes/", {}, format="json").status_code, 401)

    def test_bloqueado_no_inicia_sesion(self):
        self.bloquear()
        self.client.credentials()
        respuesta = self.client.post("/api/token/", {
            "username": "bloqueo_prueba", "password": "ClavePrueba123!",
        }, format="json")
        self.assertEqual(respuesta.status_code, 401)

    def test_refresh_no_restaura_acceso_bloqueado(self):
        self.bloquear()
        self.client.credentials()
        respuesta = self.client.post("/api/token/refresh/", {"refresh": self.tokens["refresh"]}, format="json")
        if respuesta.status_code == 200:
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {respuesta.data['access']}")
            self.assertEqual(self.client.get("/api/usuarios/actual/").status_code, 401)
        else:
            self.assertEqual(respuesta.status_code, 401)
