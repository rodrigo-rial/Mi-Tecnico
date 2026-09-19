from django.urls import path

from .views import EspecialidadListView, PerfilTecnicoView, ZonaListView


urlpatterns = [
    path(
        "especialidades/",
        EspecialidadListView.as_view(),
        name="especialidad_lista",
    ),
    path("zonas/", ZonaListView.as_view(), name="zona_lista"),
    path("perfil/", PerfilTecnicoView.as_view(), name="perfil_tecnico"),
]
