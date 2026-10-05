from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SolicitudViewSet, MisPropuestasView
from .views_trabajos import PropuestaAccionesViewSet, TrabajoViewSet

router = DefaultRouter()
router.register(r"solicitudes", SolicitudViewSet, basename="solicitud")
router.register(r"propuestas", PropuestaAccionesViewSet, basename = "propuesta")
router.register(r"trabajos", TrabajoViewSet, basename = "trabajo")

urlpatterns = [
    path("", include(router.urls)),
    path("propuestas/mias/", MisPropuestasView.as_view(), name="propuestas-mias"),
]