from django.urls import path

from . import views

urlpatterns = [
<<<<<<< HEAD
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
=======
    path("calificaciones/", views.CalificacionCrearView.as_view()),
    path("trabajos/<int:trabajo_id>/calificaciones/", views.CalificacionesDeTrabajoView.as_view()),
    path("trabajos/<int:trabajo_id>/fotos/", views.FotosDeTrabajoView.as_view()),
    path("usuarios/<int:usuario_id>/reputacion/", views.ReputacionDeUsuarioView.as_view()),
    path("tecnicos/<int:tecnico_id>/fotos/", views.FotosDeTecnicoView.as_view()),
]
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
