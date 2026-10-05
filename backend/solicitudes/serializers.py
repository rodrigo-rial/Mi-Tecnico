from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from .models import Solicitud


def a_error_drf(exc):
    """Convierte un ValidationError de Django en uno de DRF."""
    if hasattr(exc, "error_dict"):
        return serializers.ValidationError(exc.message_dict)
    return serializers.ValidationError(exc.messages)


class SolicitudSerializer(serializers.ModelSerializer):
    especialidad_nombre = serializers.CharField(
        source="especialidad.nombre", read_only=True
    )
    zona_nombre = serializers.CharField(source="zona.nombre", read_only=True)

    class Meta:
        model = Solicitud
        fields = [
            "id",
            "cliente",
            "titulo",
            "descripcion",
            "especialidad",
            "especialidad_nombre",
            "zona",
            "zona_nombre",
            "direccion",
            "fecha_preferida",
            "es_urgente",
            "estado",
            "created_at",
        ]
        read_only_fields = ["id", "cliente", "estado", "created_at"]

    def validate_especialidad(self, value):
        if not value.activa:
            raise serializers.ValidationError("La especialidad no está activa.")
        return value

    def validate_zona(self, value):
        if not value.activa:
            raise serializers.ValidationError("La zona no está activa.")
        return value

    def validate_fecha_preferida(self, value):
        if value and value < timezone.localdate():
            raise serializers.ValidationError("La fecha preferida no puede ser pasada.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None

        if self.instance is None:
            solicitud = Solicitud(cliente=user, **attrs)
        else:
            solicitud = self.instance
            for attr, val in attrs.items():
                setattr(solicitud, attr, val)

        try:
            solicitud.full_clean()
        except DjangoValidationError as exc:
            raise a_error_drf(exc)

        return attrs