from django.urls import path

from .views import RegistroUsuarioView, UsuarioActualView


urlpatterns = [
    path("registro/", RegistroUsuarioView.as_view(), name="registro"),
    path("actual/", UsuarioActualView.as_view(), name="usuario_actual"),
]