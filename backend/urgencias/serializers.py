from rest_framework import serializers

from tecnicos.models import Especialidad, Zona
from .models import Urgencia


class CrearUrgenciaSerializer(serializers.Serializer):
    especialidad = serializers.PrimaryKeyRelatedField(
        queryset=Especialidad.objects.filter(activa=True)
    )
    zona = serializers.PrimaryKeyRelatedField(queryset=Zona.objects.filter(activa=True))
    descripcion = serializers.CharField(max_length=2000)
    direccion = serializers.CharField(max_length=255)


class UrgenciaSerializer(serializers.ModelSerializer):
    especialidad_nombre = serializers.CharField(source="especialidad.nombre")
    zona_nombre = serializers.CharField(source="zona.nombre")
    asignaciones = serializers.SerializerMethodField()

    def get_asignaciones(self, urgencia):
        asignaciones = urgencia.asignaciones.select_related(
            "trabajo__tecnico"
        ).order_by("-pk")
        return [
            {
                "trabajo": asignacion.trabajo_id,
                "solicitud": asignacion.trabajo.solicitud_id,
                "estado": asignacion.trabajo.estado,
                "tecnico": (
                    asignacion.trabajo.tecnico.get_full_name()
                    or asignacion.trabajo.tecnico.username
                ),
            }
            for asignacion in asignaciones
        ]

    class Meta:
        model = Urgencia
        fields = [
            "id",
            "estado",
            "descripcion",
            "direccion",
            "especialidad_nombre",
            "zona_nombre",
            "tarifa_visita",
            "asignaciones",
            "creada_en",
        ]


class DisponibilidadUrgenciaSerializer(serializers.Serializer):
    activa = serializers.BooleanField()
