from django.conf import settings
from django.db import models
from django.db.models import Q

# T1: cuánto dura vigente un código desde que se genera.
DIAS_VIGENCIA_TOKEN = 7
# T2: protección contra adivinar los 6 dígitos probando.
MAX_INTENTOS_FALLIDOS = 5
MINUTOS_BLOQUEO = 15


class TokenTrabajo(models.Model):
    """Código de seguridad de 6 dígitos de un trabajo. NO es el JWT de sesión."""

    class Estado(models.TextChoices):
        GENERADO = "generado", "Generado"
        VALIDADO = "validado", "Validado"
        VENCIDO = "vencido", "Vencido"
        CANCELADO = "cancelado", "Cancelado"

    trabajo = models.ForeignKey(
        "solicitudes.Trabajo", on_delete=models.PROTECT, related_name="tokens"
    )
    # Cliente y técnico se copian del trabajo: el código queda asociado a ambos.
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tokens_como_cliente",
    )
    tecnico = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tokens_como_tecnico",
    )
    codigo = models.CharField(max_length=6)
    estado = models.CharField(
        max_length=10, choices=Estado.choices, default=Estado.GENERADO
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    vence_en = models.DateTimeField()
    validado_en = models.DateTimeField(null=True, blank=True)  # fecha y hora de validación
    intentos_fallidos = models.PositiveSmallIntegerField(default=0)
    bloqueado_hasta = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-creado_en", "-id"]
        constraints = [
            # REGLA: un solo código vigente (generado) por trabajo.
            models.UniqueConstraint(
                fields=["trabajo"],
                condition=Q(estado="generado"),
                name="uniq_token_generado_por_trabajo",
            ),
            # REGLA: no hay dos códigos generados iguales al mismo tiempo.
            models.UniqueConstraint(
                fields=["codigo"],
                condition=Q(estado="generado"),
                name="uniq_codigo_generado",
            ),
        ]

    def __str__(self):
        return f"Token #{self.pk} del trabajo #{self.trabajo_id} [{self.estado}]"