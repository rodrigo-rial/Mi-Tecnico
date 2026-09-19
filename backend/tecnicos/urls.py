from django.urls import path

from .views import (
    DocumentacionTecnicoView,
    EspecialidadListView,
    PerfilTecnicoView,
    ZonaListView,
)


urlpatterns = [
    path(
        "especialidades/",
        EspecialidadListView.as_view(),
        name="especialidad_lista",
    ),
    path("zonas/", ZonaListView.as_view(), name="zona_lista"),
    path("perfil/", PerfilTecnicoView.as_view(), name="perfil_tecnico"),
    path(
        "documentacion/",
        DocumentacionTecnicoView.as_view(),
        name="documentacion_tecnico",
    ),
]
