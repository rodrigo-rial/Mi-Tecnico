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


class DocumentacionTecnicoSerializer(serializers.ModelSerializer):
    documento_dni = serializers.FileField(
        write_only=True,
        required=False,
        validators=PerfilTecnico._meta.get_field("documento_dni").validators,
    )
    documento_matricula = serializers.FileField(
        write_only=True,
        required=False,
        validators=PerfilTecnico._meta.get_field("documento_matricula").validators,
    )
    tiene_documento_dni = serializers.SerializerMethodField()
    tiene_documento_matricula = serializers.SerializerMethodField()

    class Meta:
        model = PerfilTecnico
        fields = (
            "dni_numero",
            "matricula_numero",
            "documento_dni",
            "documento_matricula",
            "tiene_documento_dni",
            "tiene_documento_matricula",
            "estado_validacion",
        )
        read_only_fields = (
            "tiene_documento_dni",
            "tiene_documento_matricula",
            "estado_validacion",
        )

    def get_tiene_documento_dni(self, perfil):
        return bool(perfil.documento_dni)

    def get_tiene_documento_matricula(self, perfil):
        return bool(perfil.documento_matricula)

    def update(self, instance, validated_data):
        campos_documentacion = {
            "dni_numero",
            "matricula_numero",
            "documento_dni",
            "documento_matricula",
        }
        archivos_anteriores = {
            campo: getattr(instance, campo)
            for campo in ("documento_dni", "documento_matricula")
            if campo in validated_data and getattr(instance, campo)
        }
        if campos_documentacion.intersection(validated_data):
            instance.estado_validacion = PerfilTecnico.EstadoValidacion.PENDIENTE

        instance = super().update(instance, validated_data)

        for campo, archivo_anterior in archivos_anteriores.items():
            archivo_nuevo = getattr(instance, campo)
            if archivo_anterior.name != archivo_nuevo.name:
                archivo_anterior.storage.delete(archivo_anterior.name)

        return instance
