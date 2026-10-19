from decimal import Decimal
from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase

from solicitudes.models import Trabajo
from solicitudes.services import cambiar_estado_trabajo
from solicitudes.tests import crear_tecnico
from . import services
from .tests import Escenario


class TarifaUrgenciaTests(Escenario, APITestCase):
    def setUp(self):
        self.preparar()

    def test_tarifa_actual_requiere_sesion_y_refleja_el_servidor(self):
        url = reverse("urgencia-tarifa")
        self.assertEqual(self.client.get(url).status_code, 401)
        self.client.force_authenticate(self.cliente)
        with patch.object(services, "TARIFA", Decimal("45000.00")):
            respuesta = self.client.get(url)
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["tarifa_visita"], "45000.00")

    def test_disponibilidad_informa_tarifa_en_consulta_y_actualizacion(self):
        self.client.force_authenticate(self.tecnico)
        url = reverse("urgencia-disponibilidad")
        with patch.object(services, "TARIFA", Decimal("45000.00")):
            for respuesta in [self.client.get(url), self.client.patch(url, {"activa": True}, format="json")]:
                self.assertEqual(respuesta.status_code, 200)
                self.assertEqual(respuesta.data["tarifa_visita"], "45000.00")

    def test_historial_y_reemplazo_conservan_la_tarifa_original(self):
        self.disponible()
        with patch.object(services, "TARIFA", Decimal("42000.00")):
            urgencia = services.crear(self.cliente, self.datos)
        anterior = urgencia.asignaciones.get().trabajo
        otro = crear_tecnico("otro-tarifa", [self.e], [self.z])
        with patch.object(services, "TARIFA", Decimal("47000.00")):
            self.disponible(otro)
            cambiar_estado_trabajo(anterior, self.tecnico, "cancelado")
            self.client.force_authenticate(self.cliente)
            respuesta = self.client.get(reverse("urgencias"))
        urgencia.refresh_from_db()
        self.assertEqual(urgencia.tarifa_visita, Decimal("42000.00"))
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(Decimal(respuesta.data[0]["tarifa_visita"]), Decimal("42000.00"))
        trabajos = Trabajo.objects.filter(asignacion_urgente__urgencia=urgencia)
        self.assertEqual(trabajos.count(), 2)
        self.assertTrue(all(t.precio_acordado == Decimal("42000.00") for t in trabajos))
