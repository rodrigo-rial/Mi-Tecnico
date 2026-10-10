from rest_framework import serializers

from .models import TokenTrabajo


class ValidarTokenSerializer(serializers.Serializer):
    # Exactamente 6 dígitos. Si el formato es incorrecto ni siquiera cuenta como intento.
    codigo = serializers.RegexField(
        r"^[0-9]{6}$",
        error_messages={"invalid": "El código tiene que ser de 6 números."},
    )


class TokenTecnicoSerializer(serializers.ModelSerializer):
    """Lo que ve el TÉCNICO: incluye el código mientras esté vigente."""

    codigo = serializers.SerializerMethodField()

    class Meta:
        model = TokenTrabajo
        fields = ["id", "estado", "codigo", "vence_en", "validado_en"]

    def get_codigo(self, obj):
        # Un código usado, vencido o cancelado ya no se muestra.
        return obj.codigo if obj.estado == TokenTrabajo.Estado.GENERADO else None


class TokenClienteSerializer(serializers.ModelSerializer):
    """Lo que ve el CLIENTE: NUNCA incluye el código."""

    class Meta:
        model = TokenTrabajo
        fields = ["id", "estado", "vence_en", "validado_en"]