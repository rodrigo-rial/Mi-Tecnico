from django.db.models.signals import post_save
from django.dispatch import receiver
from solicitudes.models import Trabajo
from .services import TokenService

@receiver(post_save, sender=Trabajo)
def crear_token_al_aceptar_trabajo(sender, instance, created, **kwargs):
    # Asumiendo 'ACEPTADO' o 'PENDIENTE_INICIO' según la máquina de estados de solicitudes
    if instance.estado == getattr(Trabajo.Estado, 'ACEPTADO', 'ACEPTADO'):
        if not hasattr(instance, 'token_validacion'):
            TokenService.generar_token_para_trabajo(instance)
