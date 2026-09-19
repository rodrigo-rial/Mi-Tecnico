from types import SimpleNamespace

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from usuarios.models import Usuario

from .models import (
    LIMITE_DOCUMENTO_BYTES,
    Especialidad,
    PerfilTecnico,
    Zona,
    validar_tamano_documento,
)


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
        zonas = self.client.get(reverse("zona_lista"))

        self.assertEqual(especialidades.status_code, status.HTTP_200_OK)
        self.assertEqual(zonas.status_code, status.HTTP_200_OK)
        self.assertEqual(len(especialidades.data), 1)
        self.assertEqual(len(zonas.data), 1)
        self.assertEqual(especialidades.data[0]["nombre"], "Electricidad")
        self.assertEqual(zonas.data[0]["nombre"], "Zona Centro")

    def test_perfil_incompleto_no_puede_aprobarse(self):
        self.perfil.estado_validacion = PerfilTecnico.EstadoValidacion.APROBADO

        with self.assertRaises(ValidationError) as contexto:
            self.perfil.full_clean()

        errores = contexto.exception.message_dict
        self.assertIn("dni_numero", errores)
        self.assertIn("matricula_numero", errores)
        self.assertIn("documento_dni", errores)
        self.assertIn("documento_matricula", errores)

    def test_documentacion_completa_permite_validar_aprobacion(self):
        self.perfil.dni_numero = "12345678"
        self.perfil.matricula_numero = "MAT-123"
        self.perfil.documento_dni = SimpleUploadedFile(
            "dni.pdf",
            b"%PDF-1.4 documento de prueba",
            content_type="application/pdf",
        )
        self.perfil.documento_matricula = SimpleUploadedFile(
            "matricula.pdf",
            b"%PDF-1.4 documento de prueba",
            content_type="application/pdf",
        )
        self.perfil.estado_validacion = PerfilTecnico.EstadoValidacion.APROBADO

        self.perfil.full_clean()

        self.assertTrue(self.perfil.documentacion_completa)

    def test_documento_rechaza_extension_no_permitida(self):
        self.perfil.documento_dni = SimpleUploadedFile(
            "dni.exe",
            b"archivo de prueba",
            content_type="application/octet-stream",
        )

        with self.assertRaises(ValidationError) as contexto:
            self.perfil.full_clean()

        self.assertIn("documento_dni", contexto.exception.message_dict)

    def test_documento_rechaza_archivo_mayor_a_cinco_mb(self):
        archivo = SimpleNamespace(size=LIMITE_DOCUMENTO_BYTES + 1)

        with self.assertRaises(ValidationError):
            validar_tamano_documento(archivo)
