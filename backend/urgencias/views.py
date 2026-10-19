from django.core.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import (
    PermissionDenied as APIPermissionDenied,
    ValidationError as APIValidationError,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from solicitudes.models import Trabajo
from . import services
from .models import Disponibilidad, Urgencia
from .serializers import (
    CrearUrgenciaSerializer,
    DisponibilidadUrgenciaSerializer,
    UrgenciaSerializer,
)


def ejecutar(funcion, *args):
    """Traduce errores de negocio de Django a respuestas de la API."""
    try:
        return funcion(*args)
    except ValidationError as error:
        raise APIValidationError(error.messages) from error
    except PermissionDenied as error:
        raise APIPermissionDenied(str(error)) from error


class UrgenciasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        urgencias = Urgencia.objects.filter(cliente=request.user)
        return Response(UrgenciaSerializer(urgencias, many=True).data)

    def post(self, request):
        entrada = CrearUrgenciaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        urgencia = ejecutar(services.crear, request.user, entrada.validated_data)
        return Response(UrgenciaSerializer(urgencia).data, status=201)


class CancelarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        urgencia = get_object_or_404(Urgencia, pk=pk, cliente=request.user)
        actualizada = ejecutar(services.cancelar, urgencia, request.user)
        return Response(UrgenciaSerializer(actualizada).data)


class DisponibleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.rol != "TECNICO":
            raise APIPermissionDenied("Solo técnicos.")
        activa = Disponibilidad.objects.filter(
            tecnico=request.user, activa=True
        ).exists()
        trabajo = Trabajo.objects.filter(
            tecnico=request.user,
            estado__in=["pendiente", "en_proceso"],
            asignacion_urgente__isnull=False,
        ).first()
        return Response({
            "tarifa_visita": str(services.TARIFA),
            "activa": activa,
            "habilitado": services.elegible(request.user),
            "trabajo": trabajo.pk if trabajo else None,
        })

    def patch(self, request):
        entrada = DisponibilidadUrgenciaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        disponibilidad = ejecutar(
            services.cambiar_disponibilidad,
            request.user,
            entrada.validated_data["activa"],
        )
        return Response({
            "tarifa_visita": str(services.TARIFA),
            "activa": disponibilidad.activa,
            "habilitado": services.elegible(request.user),
        })


class TarifaUrgenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"tarifa_visita": str(services.TARIFA)})
