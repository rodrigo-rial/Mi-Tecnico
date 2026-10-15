from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework.test import APITestCase

from reputacion import services
from reputacion.models import Calificacion
from solicitudes.models import Trabajo

from .helpers import crear_trabajo, crear_usuario


class CalificacionesTests(APITestCase):
    def setUp(self):
        self.trabajo = crear_trabajo()
        self.url = reverse("calificaciones-trabajo", args=[self.trabajo.pk])

    def test_cliente_califica_al_tecnico(self):
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.post(self.url, {"puntaje": 5, "comentario": "Excelente"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["destinatario"], self.trabajo.tecnico_id)

    def test_tecnico_califica_al_cliente(self):
        self.client.force_authenticate(self.trabajo.tecnico)
        r = self.client.post(self.url, {"puntaje": 4}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["destinatario"], self.trabajo.cliente_id)

    def test_promedio_y_cantidad(self):
        otro = crear_trabajo(tecnico=self.trabajo.tecnico, email_cliente="otro@test.com")
        services.crear_calificacion(self.trabajo, self.trabajo.cliente, 5)
        services.crear_calificacion(otro, otro.cliente, 4)
        self.assertEqual(
            services.resumen_reputacion(self.trabajo.tecnico),
            {"promedio": 4.5, "cantidad": 2},
        )
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.get(reverse("reputacion-usuario", args=[self.trabajo.tecnico_id]))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["promedio"], 4.5)
        self.assertEqual(r.data["cantidad"], 2)

    def test_usuario_sin_calificaciones(self):
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.get(reverse("reputacion-usuario", args=[self.trabajo.tecnico_id]))
        self.assertIsNone(r.data["promedio"])
        self.assertEqual(r.data["cantidad"], 0)

    def test_estado_de_calificacion_del_trabajo(self):
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.get(self.url)
        self.assertTrue(r.data["puedo_calificar"])
        self.assertEqual(r.data["contraparte_id"], self.trabajo.tecnico_id)
        self.client.post(self.url, {"puntaje": 5}, format="json")
        r = self.client.get(self.url)
        self.assertTrue(r.data["ya_califique"])
        self.assertFalse(r.data["puedo_calificar"])

    def test_trabajo_no_finalizado_rechaza(self):
        self.trabajo.estado = Trabajo.Estado.EN_PROCESO
        self.trabajo.save()
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.post(self.url, {"puntaje": 5}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_tercero_no_puede_calificar(self):
        tercero = crear_usuario("tercero@test.com", "CLIENTE")
        self.client.force_authenticate(tercero)
        r = self.client.post(self.url, {"puntaje": 5}, format="json")
        self.assertEqual(r.status_code, 403)

    def test_tercero_no_puede_ver_el_estado(self):
        self.client.force_authenticate(crear_usuario("tercero@test.com", "CLIENTE"))
        self.assertEqual(self.client.get(self.url).status_code, 403)

    def test_no_se_califica_dos_veces(self):
        self.client.force_authenticate(self.trabajo.cliente)
        self.client.post(self.url, {"puntaje": 5}, format="json")
        r = self.client.post(self.url, {"puntaje": 3}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_puntaje_fuera_de_rango(self):
        self.client.force_authenticate(self.trabajo.cliente)
        for puntaje in (0, 6):
            r = self.client.post(self.url, {"puntaje": puntaje}, format="json")
            self.assertEqual(r.status_code, 400)

    def test_sin_login_da_401(self):
        r = self.client.post(self.url, {"puntaje": 5}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_trabajo_inexistente_da_404(self):
        self.client.force_authenticate(self.trabajo.cliente)
        r = self.client.post(reverse("calificaciones-trabajo", args=[99999]), {"puntaje": 5}, format="json")
        self.assertEqual(r.status_code, 404)

    def test_la_base_impide_autocalificacion(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Calificacion.objects.create(
                    trabajo=self.trabajo,
                    autor=self.trabajo.cliente,
                    destinatario=self.trabajo.cliente,
                    puntaje=3,
                )
