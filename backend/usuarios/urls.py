from django.urls import path

from .views import (
    AccesoAdministradorView,
    AccesoClienteView,
    AccesoTecnicoView,
    RegistroUsuarioView,
    UsuarioActualView,
)


urlpatterns = [
    path("registro/", RegistroUsuarioView.as_view(), name="registro"),
    path("actual/", UsuarioActualView.as_view(), name="usuario_actual"),
    path("acceso/cliente/", AccesoClienteView.as_view(), name="acceso_cliente"),
    path("acceso/tecnico/", AccesoTecnicoView.as_view(), name="acceso_tecnico"),
    path(
        "acceso/administrador/",
        AccesoAdministradorView.as_view(),
        name="acceso_administrador",
    ),
]