from django.urls import path

from . import views

urlpatterns = [
    path("calificaciones/", views.CalificacionCrearView.as_view()),
    path("trabajos/<int:trabajo_id>/calificaciones/", views.CalificacionesDeTrabajoView.as_view()),
    path("trabajos/<int:trabajo_id>/fotos/", views.FotosDeTrabajoView.as_view()),
    path("usuarios/<int:usuario_id>/reputacion/", views.ReputacionDeUsuarioView.as_view()),
    path("tecnicos/<int:tecnico_id>/fotos/", views.FotosDeTecnicoView.as_view()),
]