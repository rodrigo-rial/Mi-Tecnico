from django.urls import path

from .views import (
    AccesoAdministradorView,
    AccesoClienteView,
    AccesoTecnicoView,
    RegistroUsuarioView,
    UsuarioActualView,
)


from .fotos import MiFotoView, FotoUsuarioView

urlpatterns = [
    path("actual/foto/", MiFotoView.as_view(), name="mi_foto"),
    path("<int:usuario_id>/foto/", FotoUsuarioView.as_view(), name="foto_usuario"),
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