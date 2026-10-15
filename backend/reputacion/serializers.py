from rest_framework import serializers

from .models import Calificacion, FotoTrabajo

<<<<<<< HEAD
TAMANIO_MAXIMO_FOTO = 5 * 1024 * 1024  # 5 MB


class CalificacionCrearSerializer(serializers.Serializer):
    puntaje = serializers.IntegerField(min_value=1, max_value=5)
    comentario = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")


class CalificacionSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source="autor.get_full_name")
    autor_username = serializers.ReadOnlyField(source="autor.username")
=======

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
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308

    class Meta:
        model = Calificacion
        fields = [
<<<<<<< HEAD
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
=======
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
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308


class FotoTrabajoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoTrabajo
<<<<<<< HEAD
        fields = ["id", "trabajo", "tecnico", "imagen", "descripcion", "created_at"]
=======
        fields = ["id", "trabajo", "imagen", "descripcion", "created_at"]
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
