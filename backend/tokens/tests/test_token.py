from datetime import timedelta

from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from reputacion.tests.helpers import crear_trabajo, crear_usuario  # T5
from solicitudes.models import Trabajo
from tokens.models import MAX_INTENTOS_FALLIDOS, TokenTrabajo


def codigo_incorrecto(token):
    return "000000" if token.codigo != "000000" else "111111"


class TokenTests(APITestCase):
    def setUp(self):
        self.trabajo = crear_trabajo(estado=Trabajo.Estado.PENDIENTE)
        # El código lo creó la señal al crearse el trabajo.
        self.token = TokenTrabajo.objects.get(trabajo=self.trabajo)
        self.url_ver = reverse("token-trabajo", args=[self.trabajo.pk])
        self.url_validar = reverse("token-validar", args=[self.trabajo.pk])
        self.url_regenerar = reverse("token-regenerar", args=[self.trabajo.pk])

    def validar(self, codigo):
        return self.client.post(self.url_validar, {"codigo": codigo}, format="json")

    # --- generación ---
    def test_se_genera_al_crear_el_trabajo(self):
        self.assertEqual(len(self.token.codigo), 6)
        self.assertTrue(self.token.codigo.isdigit())
        self.assertEqual(self.token.estado, TokenTrabajo.Estado.GENERADO)
        self.assertEqual(self.token.cliente_id, self.trabajo.cliente_id)
        self.assertEqual(self.token.tecnico_id, self.trabajo.tecnico_id)
        self.assertGreater(self.token.vence_en, timezone.now())

    def test_cada_trabajo_tiene_su_propio_token(self):
        otro = crear_trabajo(
            estado=Trabajo.Estado.PENDIENTE,
            tecnico=crear_usuario("tec2@test.com", "TECNICO"),
            email_cliente="otro@test.com",
        )
        token_otro = TokenTrabajo.objects.get(trabajo=otro)
        self.assertNotEqual(token_otro.pk, self.token.pk)

    def test_la_base_impide_dos_codigos_vigentes_por_trabajo(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                TokenTrabajo.objects.create(
                    trabajo=self.trabajo, cliente=self.trabajo.cliente,
                    tecnico=self.trabajo.tecnico, codigo="123456",
                    vence_en=timezone.now() + timedelta(days=1),
                )

    # --- visibilidad del código ---
    def test_tecnico_ve_el_codigo(self):
        self.client.force_authenticate(self.trabajo.tecnico)
        r = self.client.get(self.url_ver)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["token"]["codigo"], self.token.codigo)

    def test_cliente_no_ve_el_codigo(self):
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.get(self.url_ver)
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("codigo", r.data["token"])

    def test_tercero_no_ve_nada(self):
        self.client.force_authenticate(crear_usuario("tercero@test.com", "CLIENTE"))
        self.assertEqual(self.client.get(self.url_ver).status_code, 403)

    # --- validación correcta ---
    def test_cliente_valida_con_el_codigo_correcto(self):
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.validar(self.token.codigo)
        self.assertEqual(r.status_code, 200)
        self.token.refresh_from_db()
        self.assertEqual(self.token.estado, TokenTrabajo.Estado.VALIDADO)
        self.assertIsNotNone(self.token.validado_en)
        self.trabajo.refresh_from_db()
        self.assertEqual(self.trabajo.estado, Trabajo.Estado.EN_PROCESO)  # T3

    # --- validación incorrecta y permisos ---
    def test_codigo_incorrecto_se_rechaza(self):
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.validar(codigo_incorrecto(self.token))
        self.assertEqual(r.status_code, 400)
        self.token.refresh_from_db()
        self.assertEqual(self.token.intentos_fallidos, 1)
        self.assertEqual(self.token.estado, TokenTrabajo.Estado.GENERADO)

    def test_tecnico_no_puede_validar(self):
        self.client.force_authenticate(self.trabajo.tecnico)
        self.assertEqual(self.validar(self.token.codigo).status_code, 403)

    def test_tercero_no_puede_validar(self):
        self.client.force_authenticate(crear_usuario("tercero@test.com", "CLIENTE"))
        self.assertEqual(self.validar(self.token.codigo).status_code, 403)

    def test_sin_login_da_401(self):
        self.assertEqual(self.validar("123456").status_code, 401)

    def test_formato_invalido(self):
        self.client.force_authenticate(self.trabajo.cliente)
        for codigo in ("12ab56", "12345", "1234567"):
            self.assertEqual(self.validar(codigo).status_code, 400)

    def test_codigo_ya_usado_se_rechaza(self):
        self.client.force_authenticate(self.trabajo.cliente)
        self.validar(self.token.codigo)
        self.assertEqual(self.validar(self.token.codigo).status_code, 400)

    def test_codigo_vencido_se_rechaza(self):
        TokenTrabajo.objects.filter(pk=self.token.pk).update(
            vence_en=timezone.now() - timedelta(minutes=1)
        )
        self.client.force_authenticate(self.trabajo.cliente)
        self.assertEqual(self.validar(self.token.codigo).status_code, 400)
        self.token.refresh_from_db()
        self.assertEqual(self.token.estado, TokenTrabajo.Estado.VENCIDO)

    def test_codigo_cancelado_se_rechaza(self):
        # Al cancelar el trabajo, la señal cancela el código.
        self.trabajo.cambiar_estado(Trabajo.Estado.CANCELADO)
        self.token.refresh_from_db()
        self.assertEqual(self.token.estado, TokenTrabajo.Estado.CANCELADO)
        self.client.force_authenticate(self.trabajo.cliente)
        self.assertEqual(self.validar(self.token.codigo).status_code, 400)

    def test_bloqueo_tras_demasiados_intentos(self):
        self.client.force_authenticate(self.trabajo.cliente)
        malo = codigo_incorrecto(self.token)
        for _ in range(MAX_INTENTOS_FALLIDOS - 1):
            self.assertEqual(self.validar(malo).status_code, 400)
        self.assertEqual(self.validar(malo).status_code, 429)
        # Bloqueado: ni el código correcto sirve hasta que pase el tiempo.
        self.assertEqual(self.validar(self.token.codigo).status_code, 429)

    # --- regeneración ---
    def test_tecnico_regenera_el_codigo(self):
        self.client.force_authenticate(self.trabajo.tecnico)
        r = self.client.post(self.url_regenerar)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["token"]["estado"], "generado")
        self.token.refresh_from_db()
        self.assertEqual(self.token.estado, TokenTrabajo.Estado.CANCELADO)

    def test_cliente_no_puede_regenerar(self):
        self.client.force_authenticate(self.trabajo.cliente)
        self.assertEqual(self.client.post(self.url_regenerar).status_code, 403)

    def test_no_se_regenera_un_codigo_ya_validado(self):
        self.client.force_authenticate(self.trabajo.cliente)
        self.validar(self.token.codigo)
        self.client.force_authenticate(self.trabajo.tecnico)
        self.assertEqual(self.client.post(self.url_regenerar).status_code, 400)