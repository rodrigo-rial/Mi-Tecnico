from django.urls import path

from . import views

urlpatterns = [
    path(
        "trabajos/<int:trabajo_id>/calificaciones/",
        views.CalificacionesDeTrabajoView.as_view(),
        name="calificaciones-trabajo",
    ),
    path(
        "trabajos/<int:trabajo_id>/fotos/",
        views.FotosDeTrabajoView.as_view(),
        name="fotos-trabajo",
    ),
    path(
        "usuarios/<int:usuario_id>/reputacion/",
        views.ReputacionUsuarioView.as_view(),
        name="reputacion-usuario",
    ),
    path(
        "usuarios/<int:usuario_id>/fotos/",
        views.FotosDeUsuarioView.as_view(),
        name="fotos-usuario",
    ),
]
