from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework import serializers
from rest_framework.exceptions import ValidationError as APIValidationError, PermissionDenied as APIPermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from tecnicos.models import Especialidad, Zona
from .models import Urgencia, Disponibilidad
from solicitudes.models import Trabajo
from . import services


def ejecutar(fn, *args):
    try:
        return fn(*args)
    except ValidationError as e:
        raise APIValidationError(e.messages)
    except PermissionDenied as e:
        raise APIPermissionDenied(str(e))


class Entrada(serializers.Serializer):
    especialidad = serializers.PrimaryKeyRelatedField(queryset=Especialidad.objects.filter(activa=True))
    zona = serializers.PrimaryKeyRelatedField(queryset=Zona.objects.filter(activa=True))
    descripcion = serializers.CharField(max_length=2000)
    direccion = serializers.CharField(max_length=255)


class Salida(serializers.ModelSerializer):
    especialidad_nombre = serializers.CharField(source="especialidad.nombre")
    zona_nombre = serializers.CharField(source="zona.nombre")
    asignaciones = serializers.SerializerMethodField()
    def get_asignaciones(self, obj):
        return [{"trabajo": a.trabajo_id, "solicitud": a.trabajo.solicitud_id, "estado": a.trabajo.estado,
                 "tecnico": a.trabajo.tecnico.get_full_name() or a.trabajo.tecnico.username}
                for a in obj.asignaciones.select_related("trabajo__tecnico").order_by("-pk")]
    class Meta:
        model = Urgencia
        fields = ["id", "estado", "descripcion", "direccion", "especialidad_nombre", "zona_nombre", "tarifa_visita", "asignaciones", "creada_en"]


class UrgenciasView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(Salida(Urgencia.objects.filter(cliente=request.user), many=True).data)
    def post(self, request):
        entrada = Entrada(data=request.data)
        entrada.is_valid(raise_exception=True)
        urgencia = ejecutar(services.crear, request.user, entrada.validated_data)
        return Response(Salida(urgencia).data, status=201)


class CancelarView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        urgencia = get_object_or_404(Urgencia, pk=pk, cliente=request.user)
        return Response(Salida(ejecutar(services.cancelar, urgencia, request.user)).data)


class DisponibleView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.rol != "TECNICO":
            raise APIPermissionDenied("Solo técnicos.")
        activa = Disponibilidad.objects.filter(tecnico=request.user, activa=True).exists()
        trabajo = Trabajo.objects.filter(tecnico=request.user, estado__in=["pendiente", "en_proceso"], asignacion_urgente__isnull=False).first()
        return Response({"tarifa_visita": str(services.TARIFA), "activa": activa, "habilitado": services.elegible(request.user), "trabajo": trabajo.pk if trabajo else None})
    def patch(self, request):
        class EntradaDisponibilidad(serializers.Serializer):
            activa = serializers.BooleanField()
        entrada = EntradaDisponibilidad(data=request.data)
        entrada.is_valid(raise_exception=True)
        d = ejecutar(services.cambiar_disponibilidad, request.user, entrada.validated_data["activa"])
        return Response({"tarifa_visita": str(services.TARIFA), "activa": d.activa, "habilitado": services.elegible(request.user)})


class TarifaUrgenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"tarifa_visita": str(services.TARIFA)})
