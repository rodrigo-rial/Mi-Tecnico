from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from . import services
from .models import Propuesta, Trabajo
from .permissions import EsCliente
from .serializers import PropuestaSerializer, a_error_drf
from .serializers_trabajos import CambiarEstadoSerializer, TrabajoSerializer


def ejecutar(servicio, *args):
    """Llama a un servicio y traduce sus errores a errores de DRF."""
    try:
        return servicio(*args)
    except DjangoPermissionDenied as exc:
        raise PermissionDenied(str(exc) or None)
    except DjangoValidationError as exc:
        raise a_error_drf(exc)


class PropuestaAccionesViewSet(viewsets.GenericViewSet):
    """Acciones del cliente sobre una propuesta recibida."""

    serializer_class = PropuestaSerializer
    permission_classes = [IsAuthenticated, EsCliente]

    def get_queryset(self):
        # Solo propuestas de solicitudes propias: las ajenas devuelven 404.
        return Propuesta.objects.filter(
            solicitud__cliente=self.request.user
        ).select_related("solicitud", "tecnico")

    @action(detail=True, methods=["post"])
    def aceptar(self, request, pk=None):
        propuesta = self.get_object()
        trabajo = ejecutar(services.aceptar_propuesta, propuesta, request.user)
        return Response(TrabajoSerializer(trabajo).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def rechazar(self, request, pk=None):
        propuesta = self.get_object()
        propuesta = ejecutar(services.rechazar_propuesta, propuesta, request.user)
        return Response(PropuestaSerializer(propuesta).data, status=status.HTTP_200_OK)


class TrabajoViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Cliente y técnico ven solo los trabajos en los que participan."""

    serializer_class = TrabajoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Trabajo.objects.filter(Q(cliente=user) | Q(tecnico=user)).select_related(
            "solicitud",
            "solicitud__especialidad",
            "solicitud__zona",
            "cliente",
            "tecnico",
        )
        if self.action == "list":
            estado = self.request.query_params.get("estado")
            if estado in Trabajo.Estado.values:
                qs = qs.filter(estado=estado)
        return qs

    @action(detail=True, methods=["post"], url_path="estado")
    def estado(self, request, pk=None):
        trabajo = self.get_object()
        entrada = CambiarEstadoSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        trabajo = ejecutar(
            services.cambiar_estado_trabajo,
            trabajo,
            request.user,
            entrada.validated_data["estado"],
        )
        return Response(TrabajoSerializer(trabajo).data, status=status.HTTP_200_OK)