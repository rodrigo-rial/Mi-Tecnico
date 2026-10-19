from django.urls import path
from .views import UrgenciasView, CancelarView, DisponibleView, TarifaUrgenciaView
urlpatterns = [
    path("urgencias/tarifa/", TarifaUrgenciaView.as_view(), name="urgencia-tarifa"),
    path("urgencias/", UrgenciasView.as_view(), name="urgencias"),
    path("urgencias/<int:pk>/cancelar/", CancelarView.as_view(), name="urgencia-cancelar"),
    path("urgencias/disponibilidad/", DisponibleView.as_view(), name="urgencia-disponibilidad"),
]
