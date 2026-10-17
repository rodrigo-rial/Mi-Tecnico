from rest_framework.test import APITestCase
from .models import Usuario


class EdicionCuentaTests(APITestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create_user(username="cliente", email="cliente@example.com", password="Prueba12345")
        self.otro = Usuario.objects.create_user(username="otro", email="otro@example.com", password="Prueba12345")
        self.client.force_authenticate(self.usuario)

    def test_persistencia_y_aislamiento(self):
        datos = {"first_name": "Ana", "last_name": "Perez", "telefono": "+54 (11) 1234-5678", "domicilio_referencia": "La Plata", "email": "nuevo@example.com"}
        self.assertEqual(self.client.patch("/api/usuarios/actual/", datos).status_code, 200)
        respuesta = self.client.get("/api/usuarios/actual/")
        for campo, valor in datos.items():
            self.assertEqual(respuesta.data[campo], valor)
        self.otro.refresh_from_db()
        self.assertEqual(self.otro.first_name, "")

    def test_no_modifica_permisos_identidad_o_password(self):
        respuesta = self.client.patch("/api/usuarios/actual/", {"id": self.otro.pk, "username": "admin", "rol": "ADMINISTRADOR", "is_staff": True, "is_superuser": True, "password": "otra", "is_active": False}, format="json")
        self.assertEqual(respuesta.status_code, 200)
        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.username, "cliente")
        self.assertEqual(self.usuario.rol, "CLIENTE")
        self.assertFalse(self.usuario.is_staff)
        self.assertFalse(self.usuario.is_superuser)
        self.assertTrue(self.usuario.is_active)
        self.assertTrue(self.usuario.check_password("Prueba12345"))

    def test_correo_duplicado(self):
        for email in ("otro@example.com", "OTRO@example.com"):
            self.assertEqual(self.client.patch("/api/usuarios/actual/", {"email": email}).status_code, 400)

    def test_correo_invalido(self):
        for email in ("", "no-es-email"):
            self.assertEqual(self.client.patch("/api/usuarios/actual/", {"email": email}).status_code, 400)

    def test_correo_propio(self):
        self.assertEqual(self.client.patch("/api/usuarios/actual/", {"email": self.usuario.email}).status_code, 200)

    def test_error_no_guarda_otros_campos(self):
        self.assertEqual(self.client.patch("/api/usuarios/actual/", {"telefono": "abc", "first_name": "No guardar"}).status_code, 400)
        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.first_name, "")

    def test_opcionales_vacios(self):
        self.assertEqual(self.client.patch("/api/usuarios/actual/", {"telefono": "", "domicilio_referencia": ""}).status_code, 200)

    def test_sin_sesion(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.patch("/api/usuarios/actual/", {"first_name": "Ana"}).status_code, 401)

    def test_tecnico_edita_su_cuenta_sin_cambiar_rol(self):
        self.usuario.rol = "TECNICO"
        self.usuario.save()
        respuesta = self.client.patch("/api/usuarios/actual/", {"first_name": "Juan"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["rol"], "TECNICO")
