from pathlib import Path

from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, Http404
from django.urls import path, reverse
from django.utils.html import format_html

from .models import Especialidad, PerfilTecnico, Zona


@admin.register(Especialidad)
class EspecialidadAdmin(admin.ModelAdmin):
    list_display = ("nombre", "activa")
    list_filter = ("activa",)
    search_fields = ("nombre",)


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "activa")
    list_filter = ("activa",)
    search_fields = ("nombre",)


@admin.register(PerfilTecnico)
class PerfilTecnicoAdmin(admin.ModelAdmin):
    list_display = (
        "usuario",
        "estado_validacion",
        "tiene_documentacion_completa",
        "actualizado_en",
    )
    list_filter = ("estado_validacion", "especialidades", "zonas")
    search_fields = ("usuario__username", "usuario__email")
    fields = (
        "usuario",
        "descripcion",
        "especialidades",
        "zonas",
        "dni_numero",
        "matricula_numero",
        "enlace_documento_dni",
        "enlace_documento_matricula",
        "estado_validacion",
        "creado_en",
        "actualizado_en",
    )
    readonly_fields = (
        "usuario",
        "descripcion",
        "especialidades",
        "zonas",
        "dni_numero",
        "matricula_numero",
        "enlace_documento_dni",
        "enlace_documento_matricula",
        "creado_en",
        "actualizado_en",
    )

    @admin.display(boolean=True, description="Documentación completa")
    def tiene_documentacion_completa(self, perfil):
        return perfil.documentacion_completa

    @admin.display(description="Documento DNI")
    def enlace_documento_dni(self, perfil):
        return self._crear_enlace_documento(perfil, "dni", perfil.documento_dni)

    @admin.display(description="Documento matrícula")
    def enlace_documento_matricula(self, perfil):
        return self._crear_enlace_documento(
            perfil,
            "matricula",
            perfil.documento_matricula,
        )

    def _crear_enlace_documento(self, perfil, tipo, archivo):
        if not perfil.pk or not archivo:
            return "No cargado"
        url = reverse(
            "admin:tecnicos_perfiltecnico_descargar_documento",
            args=(perfil.pk, tipo),
        )
        return format_html('<a href="{}">Descargar archivo</a>', url)

    def get_urls(self):
        urls_propias = [
            path(
                "<int:object_id>/documento/<str:tipo>/",
                self.admin_site.admin_view(self.descargar_documento),
                name="tecnicos_perfiltecnico_descargar_documento",
            ),
        ]
        return urls_propias + super().get_urls()

    def descargar_documento(self, request, object_id, tipo):
        perfil = self.get_object(request, object_id)
        if perfil is None:
            raise Http404
        if not self.has_view_permission(request, perfil):
            raise PermissionDenied

        archivos = {
            "dni": perfil.documento_dni,
            "matricula": perfil.documento_matricula,
        }
        archivo = archivos.get(tipo)
        if not archivo or not archivo.storage.exists(archivo.name):
            raise Http404

        return FileResponse(
            archivo.open("rb"),
            as_attachment=True,
            filename=Path(archivo.name).name,
        )

    def has_add_permission(self, request):
        return False
