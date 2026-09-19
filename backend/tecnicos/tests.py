import tempfile
from types import SimpleNamespace

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
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
from .permissions import EsTecnicoAprobado


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

    def test_tecnico_puede_cargar_su_documentacion(self):
        self.client.force_authenticate(user=self.tecnico)

        with tempfile.TemporaryDirectory() as directorio_media:
            with override_settings(MEDIA_ROOT=directorio_media):
                respuesta = self.client.patch(
                    reverse("documentacion_tecnico"),
                    {
                        "dni_numero": "12345678",
                        "matricula_numero": "MAT-123",
                        "documento_dni": SimpleUploadedFile(
                            "dni.pdf",
                            b"%PDF-1.4 documento de prueba",
                            content_type="application/pdf",
                        ),
                        "documento_matricula": SimpleUploadedFile(
                            "matricula.pdf",
                            b"%PDF-1.4 documento de prueba",
                            content_type="application/pdf",
                        ),
                    },
                    format="multipart",
                )

                self.perfil.refresh_from_db()
                self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
                self.assertEqual(self.perfil.dni_numero, "12345678")
                self.assertEqual(self.perfil.matricula_numero, "MAT-123")
                self.assertTrue(respuesta.data["tiene_documento_dni"])
                self.assertTrue(respuesta.data["tiene_documento_matricula"])
                self.assertNotIn("documento_dni", respuesta.data)
                self.assertNotIn("documento_matricula", respuesta.data)

    def test_cliente_no_puede_cargar_documentacion_tecnica(self):
        self.client.force_authenticate(user=self.cliente)

        respuesta = self.client.patch(
            reverse("documentacion_tecnico"),
            {"dni_numero": "12345678"},
            format="json",
        )

        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)

    def test_cambiar_documentacion_reinicia_validacion(self):
        self.client.force_authenticate(user=self.tecnico)

        with tempfile.TemporaryDirectory() as directorio_media:
            with override_settings(MEDIA_ROOT=directorio_media):
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
                self.perfil.estado_validacion = (
                    PerfilTecnico.EstadoValidacion.APROBADO
                )
                self.perfil.save()

                respuesta = self.client.patch(
                    reverse("documentacion_tecnico"),
                    {"matricula_numero": "MAT-456"},
                    format="json",
                )

                self.perfil.refresh_from_db()
                self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
                self.assertEqual(
                    self.perfil.estado_validacion,
                    PerfilTecnico.EstadoValidacion.PENDIENTE,
                )

    def test_usuario_comun_no_puede_descargar_documento_desde_admin(self):
        self.client.force_login(self.cliente)
        url = reverse(
            "admin:tecnicos_perfiltecnico_descargar_documento",
            args=(self.perfil.pk, "dni"),
        )

        respuesta = self.client.get(url)

        self.assertEqual(respuesta.status_code, status.HTTP_302_FOUND)
        self.assertIn("/admin/login/", respuesta.url)

    def test_superusuario_puede_descargar_documento_desde_admin(self):
        administrador = Usuario.objects.create_superuser(
            username="administrador_prueba",
            email="administrador@prueba.com",
            password="clave-segura-123",
        )
        self.client.force_login(administrador)

        with tempfile.TemporaryDirectory() as directorio_media:
            with override_settings(MEDIA_ROOT=directorio_media):
                self.perfil.documento_dni = SimpleUploadedFile(
                    "dni.pdf",
                    b"%PDF-1.4 documento de prueba",
                    content_type="application/pdf",
                )
                self.perfil.save()
                url = reverse(
                    "admin:tecnicos_perfiltecnico_descargar_documento",
                    args=(self.perfil.pk, "dni"),
                )

                respuesta = self.client.get(url)
                contenido = b"".join(respuesta.streaming_content)

                self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
                self.assertEqual(contenido, b"%PDF-1.4 documento de prueba")
                self.assertIn(
                    "attachment",
                    respuesta.headers["Content-Disposition"],
                )

    def test_tecnico_pendiente_o_rechazado_no_esta_aprobado(self):
        permiso = EsTecnicoAprobado()
        request = SimpleNamespace(user=self.tecnico)

        self.assertFalse(permiso.has_permission(request, None))

        self.perfil.estado_validacion = (
            PerfilTecnico.EstadoValidacion.RECHAZADO
        )
        self.perfil.save()
        self.assertFalse(permiso.has_permission(request, None))

    def test_cliente_y_tecnico_sin_perfil_no_estan_aprobados(self):
        permiso = EsTecnicoAprobado()
        request_cliente = SimpleNamespace(user=self.cliente)
        tecnico_sin_perfil = Usuario.objects.create_user(
            username="tecnico_sin_perfil",
            email="sinperfil@prueba.com",
            password="clave-segura-123",
            rol=Usuario.Rol.TECNICO,
        )
        request_sin_perfil = SimpleNamespace(user=tecnico_sin_perfil)

        self.assertFalse(permiso.has_permission(request_cliente, None))
        self.assertFalse(permiso.has_permission(request_sin_perfil, None))

    def test_tecnico_aprobado_supera_el_permiso(self):
        permiso = EsTecnicoAprobado()
        request = SimpleNamespace(user=self.tecnico)

        with tempfile.TemporaryDirectory() as directorio_media:
            with override_settings(MEDIA_ROOT=directorio_media):
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
                self.perfil.estado_validacion = (
                    PerfilTecnico.EstadoValidacion.APROBADO
                )
                self.perfil.save()

                self.assertTrue(permiso.has_permission(request, None))
