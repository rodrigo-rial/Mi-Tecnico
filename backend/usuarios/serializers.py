from rest_framework import serializers

from .models import Usuario


class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = Usuario
        fields = (
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "rol",
        )
        read_only_fields = ("id",)

    def validate_rol(self, value):
        if value == Usuario.Rol.ADMINISTRADOR:
            raise serializers.ValidationError(
                "No se puede registrar un administrador públicamente."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        usuario = Usuario(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario

class UsuarioActualSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "rol",
        )