from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from usuarios.models import Usuario

from .models import Especialidad, PerfilTecnico, Zona


class PerfilTecnicoAPITests(APITestCase):
    def setUp(self):
        self.especialidad = Especialidad.objects.create(nombre="Electricidad")
        self.zona = Zona.objects.create(nombre="Zona Centro")
        self.tecnico = Usuario.objects.create_user(
            username="tecnico_prueba",
            email="tecnico@prueba.com",
            password="clave-segura-123",
            rol=Usuario.Rol.TECNICO,
        )
        self.cliente = Usuario.objects.create_user(
            username="cliente_prueba",
            email="cliente@prueba.com",
            password="clave-segura-123",
            rol=Usuario.Rol.CLIENTE,
        )
        self.perfil = PerfilTecnico.objects.create(
            usuario=self.tecnico,
            descripcion="Perfil inicial",
        )
        self.perfil.especialidades.add(self.especialidad)
        self.perfil.zonas.add(self.zona)
        self.perfil_url = reverse("perfil_tecnico")

    def test_perfil_requiere_autenticacion(self):
        respuesta = self.client.get(self.perfil_url)

        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cliente_no_puede_acceder_al_perfil_tecnico(self):
        self.client.force_authenticate(user=self.cliente)

        respuesta = self.client.get(self.perfil_url)

        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)

    def test_tecnico_consulta_su_propio_perfil(self):
        self.client.force_authenticate(user=self.tecnico)

        respuesta = self.client.get(self.perfil_url)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data["usuario"], self.tecnico.id)
        self.assertEqual(
            respuesta.data["estado_validacion"],
            PerfilTecnico.EstadoValidacion.PENDIENTE,
        )

    def test_tecnico_no_puede_cambiar_usuario_ni_estado(self):
        otro_tecnico = Usuario.objects.create_user(
            username="otro_tecnico",
            email="otro@prueba.com",
            password="clave-segura-123",
            rol=Usuario.Rol.TECNICO,
        )
        self.client.force_authenticate(user=self.tecnico)

        respuesta = self.client.patch(
            self.perfil_url,
            {
                "descripcion": "Descripción actualizada",
                "usuario": otro_tecnico.id,
                "estado_validacion": PerfilTecnico.EstadoValidacion.APROBADO,
            },
            format="json",
        )

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.perfil.refresh_from_db()
        self.assertEqual(self.perfil.descripcion, "Descripción actualizada")
        self.assertEqual(self.perfil.usuario, self.tecnico)
        self.assertEqual(
            self.perfil.estado_validacion,
            PerfilTecnico.EstadoValidacion.PENDIENTE,
        )

    def test_tecnico_no_puede_dejar_zonas_vacias(self):
        self.client.force_authenticate(user=self.tecnico)

        respuesta = self.client.patch(
            self.perfil_url,
            {"zonas": []},
            format="json",
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("zonas", respuesta.data)

    def test_tecnico_no_puede_crear_un_segundo_perfil(self):
        self.client.force_authenticate(user=self.tecnico)

        respuesta = self.client.post(
            self.perfil_url,
            {
                "descripcion": "Otro perfil",
                "especialidades": [self.especialidad.id],
                "zonas": [self.zona.id],
            },
            format="json",
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_catalogos_solo_muestran_opciones_activas(self):
        Especialidad.objects.create(nombre="Inactiva", activa=False)
        Zona.objects.create(nombre="Inactiva", activa=False)
        self.client.force_authenticate(user=self.tecnico)

        especialidades = self.client.get(reverse("especialidad_lista"))
