from django.contrib import admin
from .models import Solicitud, Propuesta, Trabajo

@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "cliente", "especialidad", "zona", "estado", "es_urgente")
    list_filter = ("estado", "especialidad", "zona", "es_urgente")

@admin.register(Propuesta)
class PropuestaAdmin(admin.ModelAdmin):
    list_display = ("id", "solicitud", "tecnico", "precio", "estado")
    list_filter = ("estado",)

@admin.register(Trabajo)
class TrabajoAdmin(admin.ModelAdmin):
    list_display = ("id", "solicitud", "cliente", "tecnico", "precio_acordado", "estado")
    list_filter = ("estado",)