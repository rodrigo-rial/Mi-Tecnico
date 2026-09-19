from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Especialidad(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ("nombre",)
        verbose_name = "especialidad"
        verbose_name_plural = "especialidades"

    def __str__(self):
        return self.nombre


class Zona(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ("nombre",)
        verbose_name = "zona"
        verbose_name_plural = "zonas"

    def __str__(self):
        return self.nombre


class PerfilTecnico(models.Model):
    class EstadoValidacion(models.TextChoices):
        PENDIENTE = "PENDIENTE", "Pendiente"
        APROBADO = "APROBADO", "Aprobado"
        RECHAZADO = "RECHAZADO", "Rechazado"

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil_tecnico",
        limit_choices_to={"rol": "TECNICO"},
    )
    descripcion = models.TextField(blank=True)
    especialidades = models.ManyToManyField(
        Especialidad,
        related_name="perfiles_tecnicos",
        blank=True,
    )
    zonas = models.ManyToManyField(
        Zona,
        related_name="perfiles_tecnicos",
        blank=True,
    )
    estado_validacion = models.CharField(
        max_length=15,
        choices=EstadoValidacion.choices,
        default=EstadoValidacion.PENDIENTE,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("usuario__username",)
        verbose_name = "perfil técnico"
        verbose_name_plural = "perfiles técnicos"

    def clean(self):
        super().clean()
        if self.usuario_id and self.usuario.rol != "TECNICO":
            raise ValidationError(
                {"usuario": "El perfil técnico requiere un usuario con rol TECNICO."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Perfil técnico de {self.usuario.username}"
