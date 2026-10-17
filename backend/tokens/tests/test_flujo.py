from django.urls import reverse
from rest_framework.test import APITestCase
from solicitudes.test_trabajos import EscenarioBase
from solicitudes import services
from solicitudes.models import Trabajo, Solicitud
from tokens.models import TokenTrabajo


class FlujoVisitaTests(EscenarioBase, APITestCase):
    def test_aceptar_validar_y_finalizar(self):
        self.crear_escenario()
        trabajo = services.aceptar_propuesta(self.propuesta1, self.cliente)
        self.assertEqual(trabajo.estado, Trabajo.Estado.PENDIENTE)
        token = TokenTrabajo.objects.get(trabajo=trabajo)
        self.client.force_authenticate(self.tecnico1)
        respuesta = self.client.get(reverse("token-trabajo", args=[trabajo.pk]))
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["token"]["codigo"], token.codigo)
        self.client.force_authenticate(self.cliente)
        respuesta = self.client.post(reverse("token-validar", args=[trabajo.pk]),
                                     {"codigo": token.codigo}, format="json")
        self.assertEqual(respuesta.status_code, 200)
        trabajo.refresh_from_db()
        self.assertEqual(trabajo.estado, Trabajo.Estado.EN_PROCESO)
        services.cambiar_estado_trabajo(trabajo, self.tecnico1, Trabajo.Estado.FINALIZADO)
        trabajo.refresh_from_db()
        self.solicitud.refresh_from_db()
        self.assertEqual(trabajo.estado, Trabajo.Estado.FINALIZADO)
        self.assertEqual(self.solicitud.estado, Solicitud.Estado.FINALIZADA)
