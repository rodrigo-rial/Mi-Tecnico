from django.db.models.signals import post_save
from django.dispatch import receiver

from solicitudes.models import Trabajo

from . import services


@receiver(post_save, sender=Trabajo)
def sincronizar_token_con_trabajo(sender, instance, created, **kwargs):
    # REGLA: al crearse el Trabajo se genera su código de seguridad.
    if created:
        services.generar_token(instance)
    # REGLA: si el trabajo se cancela, su código se cancela.
    elif instance.estado == Trabajo.Estado.CANCELADO:
        services.cancelar_tokens(instance)