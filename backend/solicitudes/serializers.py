from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
from .models import Solicitud
from solicitudes.models import Propuesta


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

class PropuestaSerializer(serializers.ModelSerializer):
    tecnico_nombre = serializers.ReadOnlyField(source="tecnico.get_full_name")
    tecnico_username = serializers.ReadOnlyField(source="tecnico.username")

    class Meta:
        model = Propuesta
        fields = [
            "id",
            "solicitud",
            "tecnico",
            "tecnico_nombre",
            "tecnico_username",
            "precio",
            "descripcion_solucion",
            "fecha_disponible",
            "estado",
        ]
        read_only_fields = ["id", "solicitud", "tecnico", "estado", "creada_en", "actualizada_en"]

    def validate(self, attrs):
        # Inyectamos técnico y solicitud desde el contexto si están presentes
        tecnico = self.context.get("tecnico") or getattr(self.instance, "tecnico", None)
        solicitud = self.context.get("solicitud") or getattr(self.instance, "solicitud", None)

        if (
            self.instance is None
            and solicitud is not None
            and tecnico is not None
            and Propuesta.objects.filter(solicitud=solicitud, tecnico=tecnico).exists()
        ):
            raise serializers.ValidationError(
                "Ya enviaste una propuesta para esta solicitud."
            )        

        instancia_temp = Propuesta(
            solicitud=solicitud,
            tecnico=tecnico,
            **attrs
        )
        try:
            instancia_temp.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            )

        return attrs

    def create(self, validated_data):
        validated_data["tecnico"] = self.context["tecnico"]
        validated_data["solicitud"] = self.context["solicitud"]
        return super().create(validated_data)