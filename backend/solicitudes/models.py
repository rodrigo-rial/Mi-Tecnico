from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from tecnicos.models import PerfilTecnico
from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db.models import Q

ROL_TECNICO = "TECNICO"
ROL_CLIENTE = "CLIENTE"
VERIFICACION_APROBADO = PerfilTecnico.EstadoValidacion.APROBADO

def perfil_tecnico(usuario):
    # Devuelve el perfil técnico de usuario o None
    return getattr(usuario, "perfil_tecnico", None)

class Solicitud(models.Model):
    class Estado(models.TextChoices):
        PUBLICADA = "publicada", "Publicada"
        ASIGNADA = "asignada", "Asignada"
        FINALIZADA = "finalizada", "Finalizada"
        CANCELADA = "cancelada", "Cancelada"
 
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="solicitudes",
    )
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField()
    especialidad = models.ForeignKey(
        "tecnicos.Especialidad", on_delete=models.PROTECT, related_name="solicitudes"
    )
    zona = models.ForeignKey(
        "tecnicos.Zona", on_delete=models.PROTECT, related_name="solicitudes"
    )
    direccion = models.CharField(max_length=255)
    fecha_preferida = models.DateField(null=True, blank=True)
    es_urgente = models.BooleanField(default=False)
    estado = models.CharField(
        max_length=12, choices=Estado.choices, default=Estado.PUBLICADA
    )
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["estado", "especialidad", "zona"]),
        ]
 
    def __str__(self):
        return f"#{self.pk} {self.titulo} [{self.estado}]"

    def clean(self):
        super().clean()
        if self.cliente_id and getattr(self.cliente, "rol", None) != ROL_CLIENTE:
            raise ValidationError(
                {"cliente": "Solo un usuario con rol CLIENTE puede crear solicitudes."}
            )

    def es_propietario(self, usuario):
        return usuario.pk == self.cliente_id
 
    def puede_cancelarse(self):
        # Solo se cancela mientras no haya trabajo asignado.
        return self.estado == self.Estado.PUBLICADA
 
    def cancelar(self, usuario):
        if not self.es_propietario(usuario):
            raise ValidationError("Solo el dueño de la solicitud puede cancelarla.")
        if not self.puede_cancelarse():
            raise ValidationError(
                "Solo se pueden cancelar solicitudes en estado 'publicada'."
            )
        self.estado = self.Estado.CANCELADA
        self.save(update_fields=["estado"])

    @classmethod
    def compatibles_para(cls, tecnico):
        perfil = perfil_tecnico(tecnico)
        if perfil is None or perfil.estado_validacion != VERIFICACION_APROBADO:
            return cls.objects.none()
        return cls.objects.filter(
            estado=cls.Estado.PUBLICADA,
            especialidad__in=perfil.especialidades.all(),
            zona__in=perfil.zonas.all(),
        ).select_related("especialidad", "zona", "cliente")


class Propuesta(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        ACEPTADA = "aceptada", "Aceptada"
        RECHAZADA = "rechazada", "Rechazada"

    solicitud = models.ForeignKey(
        Solicitud, on_delete=models.CASCADE, related_name="propuestas"
    )
    tecnico = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="propuestas_enviadas",
    )
    descripcion_solucion = models.TextField()
    precio = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    fecha_disponible = models.DateField()
    estado = models.CharField(
        max_length=10, choices=Estado.choices, default=Estado.PENDIENTE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # Sin propuestas duplicadas del mismo técnico a la misma solicitud.
            models.UniqueConstraint(
                fields=["solicitud", "tecnico"], name="uniq_propuesta_solicitud_tecnico"
            ),
            # A nivel BD: una sola propuesta aceptada por solicitud.
            models.UniqueConstraint(
                fields=["solicitud"],
                condition=Q(estado="aceptada"),
                name="uniq_propuesta_aceptada_por_solicitud",
            ),
        ]

    def __str__(self):
        return f"Propuesta #{self.pk} de {self.tecnico_id} a solicitud #{self.solicitud_id}"

    def clean(self):
        super().clean()
        # Las validaciones de creación solo aplican a propuestas nuevas,
        # para no bloquear el cambio de estado posterior (aceptada/rechazada).
        if self._state.adding:
            self._validar_tecnico()
            if self.solicitud_id and self.solicitud.estado != Solicitud.Estado.PUBLICADA:
                raise ValidationError(
                    "La solicitud ya no admite propuestas (no está publicada)."
                )

    def _validar_tecnico(self):
        if not (self.tecnico_id and self.solicitud_id):
            return
        if getattr(self.tecnico, "rol", None) != ROL_TECNICO:
            raise ValidationError({"tecnico": "Solo un TECNICO puede enviar propuestas."})

        perfil = perfil_tecnico(self.tecnico)
        if perfil is None or perfil.estado_validacion != VERIFICACION_APROBADO:
            raise ValidationError(
                {"tecnico": "Solo un técnico con verificación APROBADA puede proponer."}
            )
        if not perfil.especialidades.filter(pk=self.solicitud.especialidad_id).exists():
            raise ValidationError(
                "La especialidad del técnico no coincide con la solicitud."
            )
        if not perfil.zonas.filter(pk=self.solicitud.zona_id).exists():
            raise ValidationError("El técnico no cubre la zona de la solicitud.")

    def es_propietario_solicitud(self, usuario):
        return usuario.pk == self.solicitud.cliente_id