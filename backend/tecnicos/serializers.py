from rest_framework import serializers

from .models import Especialidad, PerfilTecnico, Zona


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = ("id", "nombre")


class ZonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zona
        fields = ("id", "nombre")


class PerfilTecnicoSerializer(serializers.ModelSerializer):
    especialidades = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Especialidad.objects.filter(activa=True),
    )
    zonas = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Zona.objects.filter(activa=True),
    )

    class Meta:
        model = PerfilTecnico
        fields = (
            "id",
            "usuario",
            "descripcion",
            "especialidades",
            "zonas",
            "estado_validacion",
            "creado_en",
            "actualizado_en",
        )
        read_only_fields = (
            "id",
            "usuario",
            "estado_validacion",
            "creado_en",
            "actualizado_en",
        )

    def validate_especialidades(self, value):
        if not value:
            raise serializers.ValidationError(
                "Seleccioná al menos una especialidad."
            )
        return value

    def validate_zonas(self, value):
        if not value:
            raise serializers.ValidationError(
                "Seleccioná al menos una zona de cobertura."
            )
        return value
