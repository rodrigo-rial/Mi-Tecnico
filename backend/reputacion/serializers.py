from rest_framework import serializers

from .models import Calificacion, FotoTrabajo


def _nombre(usuario):
    # SUPUESTO: User tiene email; si tiene get_full_name() lo usamos primero.
    nombre = usuario.get_full_name() if hasattr(usuario, "get_full_name") else ""
    return nombre or getattr(usuario, "email", str(usuario))


class CalificacionCrearSerializer(serializers.Serializer):
    """Valida los datos de entrada. Las reglas de negocio están en services.py."""
    trabajo = serializers.IntegerField()
    puntaje = serializers.IntegerField(min_value=1, max_value=5)
    comentario = serializers.CharField(required=False, allow_blank=True, max_length=500)


class CalificacionSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()
    destinatario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Calificacion
        fields = [
            "id", "trabajo", "autor", "autor_nombre",
            "destinatario", "destinatario_nombre",
            "puntaje", "comentario", "created_at",
        ]

    def get_autor_nombre(self, obj):
        return _nombre(obj.autor)

    def get_destinatario_nombre(self, obj):
        return _nombre(obj.destinatario)


class FotoSubirSerializer(serializers.Serializer):
    imagen = serializers.ImageField()
    descripcion = serializers.CharField(required=False, allow_blank=True, max_length=200)


class FotoTrabajoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoTrabajo
        fields = ["id", "trabajo", "imagen", "descripcion", "created_at"]