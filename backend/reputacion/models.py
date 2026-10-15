<<<<<<< HEAD
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
=======
import os
import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# SUPUESTO: la app de Trabajo se llama "solicitudes". Si no, cambiar este import.
from solicitudes.models import Trabajo


class Calificacion(models.Model):
    """Una calificación de un participante del trabajo hacia el otro."""

    trabajo = models.ForeignKey(
        Trabajo, on_delete=models.PROTECT, related_name="calificaciones"
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
    )
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
<<<<<<< HEAD
        related_name="calificaciones_dadas",
=======
        related_name="calificaciones_emitidas",
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
    )
    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
<<<<<<< HEAD
        # Este nombre lo usa la app "urgencias" para ordenar candidatos. No lo cambies.
=======
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
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
<<<<<<< HEAD
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
=======
            # Regla de alcance: una calificación por autor y trabajo (también a nivel BD).
            models.UniqueConstraint(
                fields=["trabajo", "autor"], name="uniq_calificacion_trabajo_autor"
            ),
        ]
        indexes = [models.Index(fields=["destinatario"])]

    def __str__(self):
        return f"{self.autor_id} → {self.destinatario_id}: {self.puntaje}/5 (trabajo #{self.trabajo_id})"


def ruta_foto(instancia, nombre_archivo):
    # Nombre aleatorio para evitar choques y nombres raros del usuario.
    extension = os.path.splitext(nombre_archivo)[1].lower()
    return f"trabajos/{instancia.trabajo_id}/{uuid.uuid4().hex}{extension}"


class FotoTrabajo(models.Model):
    """Foto del trabajo terminado (historial profesional del técnico)."""

    trabajo = models.ForeignKey(
        Trabajo, on_delete=models.PROTECT, related_name="fotos"
    )
    imagen = models.ImageField(upload_to=ruta_foto)
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
    descripcion = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
<<<<<<< HEAD
        return f"Foto #{self.pk} del trabajo #{self.trabajo_id}"
=======
        return f"Foto #{self.pk} del trabajo #{self.trabajo_id}"
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
