from django.db import transaction
from django.core.exceptions import ValidationError
from rest_framework.exceptions import Throttled
from .models import TokenTrabajo
from solicitudes.models import Trabajo

class TokenService:

    @staticmethod
    @transaction.atomic
    def generar_token_para_trabajo(trabajo: Trabajo) -> TokenTrabajo:
        # Elimina o invalida token previo si existiera
        TokenTrabajo.objects.filter(trabajo=trabajo).delete()
        return TokenTrabajo.objects.create(trabajo=trabajo)

    @staticmethod
    @transaction.atomic
    def validar_token(trabajo_id: int, codigo_ingresado: str) -> bool:
        try:
            token = TokenTrabajo.objects.select_for_update().get(trabajo_id=trabajo_id)
        except TokenTrabajo.DoesNotExist:
            raise ValidationError("No existe un token asociado a este trabajo.")

        if not token.es_valido:
            raise Throttled(detail="El token ha sido bloqueado por superar el límite de intentos.")

        if token.esta_expirado:
            token.es_valido = False
            token.save(update_fields=['es_valido'])
            raise ValidationError("El token ha expirado.")

        if token.codigo != codigo_ingresado:
            token.registrar_intento_fallido()
            intentos_restantes = 5 - token.intentos_fallidos
            if intentos_restantes <= 0:
                raise Throttled(detail="Demasiados intentos fallidos. Token bloqueado.")
            raise ValidationError(f"Código incorrecto. Intentos restantes: {intentos_restantes}")

        # Token válido: Involucra transición de estado del trabajo
        trabajo = token.trabajo
        if hasattr(trabajo, 'cambiar_estado'):
            trabajo.cambiar_estado(Trabajo.Estado.EN_PROCESO)
            trabajo.save()

        token.es_valido = False  # Consumir el token tras uso exitoso
        token.save(update_fields=['es_valido'])
        return True
