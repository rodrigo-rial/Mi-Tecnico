from django.conf import settings
from django.db import models
from django.db.models import Q


class Disponibilidad(models.Model):
    tecnico = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    activa = models.BooleanField(default=False)
    desde = models.DateTimeField(auto_now=True)


class Urgencia(models.Model):
    class Estado(models.TextChoices):
        BUSCANDO = "buscando", "Buscando técnico"
        ASIGNADA = "asignada", "Técnico asignado"
        FINALIZADA = "finalizada", "Finalizada"
        CANCELADA = "cancelada", "Cancelada"
    cliente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    especialidad = models.ForeignKey("tecnicos.Especialidad", on_delete=models.PROTECT)
    zona = models.ForeignKey("tecnicos.Zona", on_delete=models.PROTECT)
    descripcion = models.TextField(max_length=2000)
    direccion = models.CharField(max_length=255)
    tarifa_visita = models.DecimalField(max_digits=12, decimal_places=2, default=40000)
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.BUSCANDO)
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creada_en"]
        constraints = [models.UniqueConstraint(fields=["cliente"], condition=Q(estado__in=["buscando", "asignada"]), name="una_urgencia_activa_por_cliente")]


class Asignacion(models.Model):
    urgencia = models.ForeignKey(Urgencia, on_delete=models.PROTECT, related_name="asignaciones")
    trabajo = models.OneToOneField("solicitudes.Trabajo", on_delete=models.PROTECT, related_name="asignacion_urgente")
    creada_en = models.DateTimeField(auto_now_add=True)
