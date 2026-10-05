from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SolicitudViewSet, MisPropuestasView

router = DefaultRouter()
router.register(r"solicitudes", SolicitudViewSet, basename="solicitud")

urlpatterns = [
    path("", include(router.urls)),
    path("propuestas/mias/", MisPropuestasView.as_view(), name="propuestas-mias"),
]