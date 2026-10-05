from django.contrib import admin
from .models import Solicitud

@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "cliente", "especialidad", "zona", "estado", "es_urgente")
    list_filter = ("estado", "especialidad", "zona", "es_urgente")