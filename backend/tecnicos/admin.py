from django.contrib import admin

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
    filter_horizontal = ("especialidades", "zonas")
    readonly_fields = ("creado_en", "actualizado_en")

    @admin.display(boolean=True, description="Documentación completa")
    def tiene_documentacion_completa(self, perfil):
        return perfil.documentacion_completa
