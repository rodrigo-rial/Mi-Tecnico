from django.urls import path

from . import views

urlpatterns = [
    path("trabajos/<int:trabajo_id>/token/",
         views.TokenDeTrabajoView.as_view(), name="token-trabajo"),
    path("trabajos/<int:trabajo_id>/token/validar/",
         views.ValidarTokenView.as_view(), name="token-validar"),
    path("trabajos/<int:trabajo_id>/token/regenerar/",
         views.RegenerarTokenView.as_view(), name="token-regenerar"),
]