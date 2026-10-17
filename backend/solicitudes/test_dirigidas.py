from datetime import date
from rest_framework.test import APITestCase
from solicitudes.tests import crear_usuario, crear_tecnico
from tecnicos.models import Especialidad, Zona
from solicitudes.models import Solicitud, Trabajo


class SolicitudesDirigidasTests(APITestCase):
    def setUp(self):
        self.e = Especialidad.objects.get(nombre="Electricidad")
        self.z = Zona.objects.get(nombre="Tolosa")
        self.cliente = crear_usuario("dir-cliente", "CLIENTE")
        self.tecnico = crear_tecnico("dir-tecnico", [self.e], [self.z])
        self.otro = crear_tecnico("dir-otro", [self.e], [self.z])

    def crear(self, **extra):
        self.client.force_authenticate(self.cliente)
        datos = dict(titulo="Tablero", descripcion="Sin luz", direccion="Calle 1", especialidad=self.e.pk, zona=self.z.pk, tecnico_destinatario=self.tecnico.pk)
        datos.update(extra)
        return self.client.post("/api/solicitudes/", datos, format="json")

    def test_solo_destinatario_ve_y_propone(self):
        respuesta = self.crear()
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        pk = respuesta.data["id"]
        self.assertFalse(Trabajo.objects.exists())
        propuesta = dict(precio="1000.00", descripcion_solucion="Revisar tablero", fecha_disponible=date.today().isoformat())
        self.client.force_authenticate(self.otro)
        self.assertEqual(self.client.get(f"/api/solicitudes/{pk}/").status_code, 404)
        self.assertEqual(self.client.post(f"/api/solicitudes/{pk}/propuestas/", propuesta).status_code, 400)
        self.client.force_authenticate(self.tecnico)
        self.assertEqual(self.client.get(f"/api/solicitudes/{pk}/").status_code, 200)
        oferta = self.client.post(f"/api/solicitudes/{pk}/propuestas/", propuesta)
        self.assertEqual(oferta.status_code, 201, oferta.data)
        self.client.force_authenticate(self.cliente)
        self.assertEqual(self.client.post(f"/api/propuestas/{oferta.data['id']}/aceptar/").status_code, 201)
        self.assertEqual(Trabajo.objects.get().tecnico_id, self.tecnico.pk)

    def test_rechaza_destinatario_incompatible(self):
        self.tecnico.perfil_tecnico.zonas.clear()
        self.assertEqual(self.crear().status_code, 400)
        self.assertFalse(Solicitud.objects.exists())

    def test_catalogo_filtra_y_no_expone_documentos(self):
        self.client.force_authenticate(self.cliente)
        self.otro.is_active = False
        self.otro.save()
        respuesta = self.client.get(f"/api/tecnicos/catalogo/?zona={self.z.pk}&especialidad={self.e.pk}")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual([r["id"] for r in respuesta.data["results"]], [self.tecnico.pk])
        self.assertEqual(set(respuesta.data["results"][0]), {"id", "nombre", "descripcion", "especialidades", "zonas", "promedio", "cantidad"})
        self.assertEqual(self.client.get("/api/tecnicos/catalogo/?zona=abc").status_code, 400)

    def test_solicitud_normal_sigue_visible_a_compatibles(self):
        respuesta = self.crear(tecnico_destinatario=None)
        self.assertEqual(respuesta.status_code, 201)
        self.client.force_authenticate(self.otro)
        self.assertEqual(self.client.get(f"/api/solicitudes/{respuesta.data['id']}/").status_code, 200)
