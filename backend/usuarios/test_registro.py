from rest_framework.test import APITestCase
from .models import Usuario


class RegistroSeguroTests(APITestCase):
    def registrar(self, **cambios):
        datos = {"username": "nuevo", "email": "nuevo@example.com", "password": "ClavePrueba123!", "rol": "CLIENTE"}
        datos.update(cambios)
        return self.client.post("/api/usuarios/registro/", datos, format="json")

    def test_correo_repetido_sin_importar_mayusculas(self):
        Usuario.objects.create_user(username="existente", email="Existente@Example.com", password="ClavePrueba123!")
        for correo in ["existente@example.com", "EXISTENTE@EXAMPLE.COM"]:
            with self.subTest(correo=correo):
                respuesta = self.registrar(email=correo)
                self.assertEqual(respuesta.status_code, 400)
                self.assertIn("email", respuesta.data)
        self.assertEqual(Usuario.objects.count(), 1)

    def test_normaliza_correo_y_protege_password(self):
        respuesta = self.registrar(email=" NUEVO@EXAMPLE.COM ")
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        usuario = Usuario.objects.get(username="nuevo")
        self.assertEqual(usuario.email, "nuevo@example.com")
        self.assertTrue(usuario.check_password("ClavePrueba123!"))
        self.assertNotEqual(usuario.password, "ClavePrueba123!")
        self.assertNotIn("password", respuesta.data)

    def test_no_permite_registro_administrador(self):
        respuesta = self.registrar(rol="ADMINISTRADOR")
        self.assertEqual(respuesta.status_code, 400)
        self.assertFalse(Usuario.objects.exists())

    def test_no_otorga_permisos_enviados_por_cliente(self):
        respuesta = self.registrar(is_staff=True, is_superuser=True)
        self.assertEqual(respuesta.status_code, 201)
        usuario = Usuario.objects.get(username="nuevo")
        self.assertFalse(usuario.is_staff)
        self.assertFalse(usuario.is_superuser)
        self.assertEqual(usuario.rol, "CLIENTE")
