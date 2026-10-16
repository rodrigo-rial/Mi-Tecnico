from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/usuarios/", include("usuarios.urls")),
    path("api/tecnicos/", include("tecnicos.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("solicitudes.urls")),
    path("api/", include("tokens.urls")),
    path("api/", include("urgencias.urls")),
    path("api/", include("reputacion.urls")),
]

# Solo las fotos del historial son públicas; los documentos técnicos
# continúan accesibles exclusivamente por las descargas del administrador.
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL + "trabajos/",
        document_root=settings.MEDIA_ROOT / "trabajos",
    )
