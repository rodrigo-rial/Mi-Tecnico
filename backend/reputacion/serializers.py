from rest_framework import serializers

from .models import Calificacion, FotoTrabajo

TAMANIO_MAXIMO_FOTO = 5 * 1024 * 1024  # 5 MB


class CalificacionCrearSerializer(serializers.Serializer):
    puntaje = serializers.IntegerField(min_value=1, max_value=5)
    comentario = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")


class CalificacionSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source="autor.get_full_name")
    autor_username = serializers.ReadOnlyField(source="autor.username")

    class Meta:
        model = Calificacion
        fields = [
            "id",
            "trabajo",
            "autor",
            "autor_nombre",
            "autor_username",
            "destinatario",
            "puntaje",
            "comentario",
            "created_at",
        ]


class FotoCrearSerializer(serializers.Serializer):
    imagen = serializers.ImageField()
    descripcion = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")

    def validate_imagen(self, imagen):
        if imagen.size > TAMANIO_MAXIMO_FOTO:
            raise serializers.ValidationError("La imagen no puede superar los 5 MB.")
        return imagen


class FotoTrabajoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoTrabajo
        fields = ["id", "trabajo", "tecnico", "imagen", "descripcion", "created_at"]
