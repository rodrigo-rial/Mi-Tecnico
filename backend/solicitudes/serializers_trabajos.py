from rest_framework import serializers
from .models import Trabajo


class TrabajoSerializer(serializers.ModelSerializer):
    solicitud_titulo = serializers.ReadOnlyField(source="solicitud.titulo")
    solicitud_descripcion = serializers.ReadOnlyField(source="solicitud.descripcion")
    direccion = serializers.ReadOnlyField(source="solicitud.direccion")
    especialidad_nombre = serializers.ReadOnlyField(
        source="solicitud.especialidad.nombre"
    )
    zona_nombre = serializers.ReadOnlyField(source="solicitud.zona.nombre")
    cliente_nombre = serializers.ReadOnlyField(source="cliente.get_full_name")
    cliente_username = serializers.ReadOnlyField(source="cliente.username")
    tecnico_nombre = serializers.ReadOnlyField(source="tecnico.get_full_name")
    tecnico_username = serializers.ReadOnlyField(source="tecnico.username")

    class Meta:
        model = Trabajo
        fields = [
            "id",
            "solicitud",
            "solicitud_titulo",
            "solicitud_descripcion",
            "direccion",
            "especialidad_nombre",
            "zona_nombre",
            "propuesta",
            "cliente",
            "cliente_nombre",
            "cliente_username",
            "tecnico",
            "tecnico_nombre",
            "tecnico_username",
            "precio_acordado",
            "estado",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class CambiarEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Trabajo.Estado.choices)