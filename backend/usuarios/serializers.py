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

    def validate_email(self, value):
        value = value.strip().lower()
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value

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
    foto_perfil = serializers.SerializerMethodField()

    def get_foto_perfil(self, obj):
        from .fotos import ruta_foto
        return ruta_foto(obj)

    class Meta:
        model = Usuario
        fields = (
            "id", "username", "email", "first_name", "last_name", "rol",
            "telefono", "domicilio_referencia", "foto_perfil",
        )
        read_only_fields = ("id", "username", "rol")
        extra_kwargs = {"email": {"required": True, "allow_blank": False}}

    def validate_email(self, value):
        value = value.strip().lower()
        otros = Usuario.objects.filter(email__iexact=value)
        if self.instance:
            otros = otros.exclude(pk=self.instance.pk)
        if otros.exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value

    def validate_telefono(self, value):
        import re
        value = value.strip()
        if value and (not re.fullmatch(r"[0-9+() .-]+", value) or not 6 <= sum(c.isdigit() for c in value) <= 20):
            raise serializers.ValidationError("Ingresá un teléfono válido, con entre 6 y 20 dígitos.")
        return value
