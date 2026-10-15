from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Q

MAX_FOTOS_POR_TRABAJO = 5


class Calificacion(models.Model):
    """Una sola entidad para las dos direcciones: cliente→técnico y técnico→cliente."""

    trabajo = models.ForeignKey(
        "solicitudes.Trabajo",
        on_delete=models.PROTECT,
        related_name="calificaciones",
    )
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="calificaciones_dadas",
    )
    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        # Este nombre lo usa la app "urgencias" para ordenar candidatos. No lo cambies.
        related_name="calificaciones_recibidas",
    )
    puntaje = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comentario = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["trabajo", "autor"], name="uniq_calificacion_trabajo_autor"
            ),
            models.CheckConstraint(
                condition=Q(puntaje__gte=1, puntaje__lte=5),
                name="calificacion_puntaje_1_a_5",
            ),
            models.CheckConstraint(
                condition=~Q(autor=F("destinatario")),
                name="calificacion_no_a_si_mismo",
            ),
        ]

    def __str__(self):
        return f"Calificacion #{self.pk}: {self.autor_id} → {self.destinatario_id} ({self.puntaje})"


class FotoTrabajo(models.Model):
    """Foto del trabajo terminado: forma el historial profesional del técnico."""

    trabajo = models.ForeignKey(
        "solicitudes.Trabajo", on_delete=models.PROTECT, related_name="fotos"
    )
    tecnico = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="fotos_subidas",
    )
    imagen = models.ImageField(upload_to="trabajos/%Y/%m/")
    descripcion = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Foto #{self.pk} del trabajo #{self.trabajo_id}"
