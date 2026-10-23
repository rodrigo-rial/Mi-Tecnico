from django.core.exceptions import PermissionDenied
from django.core.exceptions import ValidationError as ErrorDeValidacion
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from solicitudes.models import Trabajo

from . import services
from .serializers import (
    TokenClienteSerializer,
    TokenTecnicoSerializer,
    ValidarTokenSerializer,
)


def respuesta_de_error(error):
    """Reglas de negocio → 403 (permiso), 429 (bloqueo) o 400 (validación)."""
    if isinstance(error, PermissionDenied):
        return Response(
            {"detalle": str(error) or "No tenés permiso para hacer esto."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if isinstance(error, services.DemasiadosIntentos):
        return Response({"detalle": str(error)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    return Response({"detalle": error.messages[0]}, status=status.HTTP_400_BAD_REQUEST)


class TokenDeTrabajoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trabajo_id):
        trabajo = get_object_or_404(Trabajo, pk=trabajo_id)
        if not trabajo.es_participante(request.user):
            return Response(
                {"detalle": "No sos participante de este trabajo."},
                status=status.HTTP_403_FORBIDDEN,
            )
        token = services.obtener_o_generar_token(trabajo)
        if token is None:
            return Response(
                {"detalle": "Este trabajo no tiene código de seguridad."},
                status=status.HTTP_404_NOT_FOUND,
            )

        es_tecnico = request.user.pk == trabajo.tecnico_id
        # El cliente usa un serializer que no tiene el campo "codigo".
        serializer = TokenTecnicoSerializer if es_tecnico else TokenClienteSerializer
        return Response({
            "trabajo_id": trabajo.pk,
            "trabajo_estado": trabajo.estado,
            "rol": "tecnico" if es_tecnico else "cliente",
            "token": serializer(token).data,
        })


class ValidarTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trabajo_id):
        trabajo = get_object_or_404(Trabajo, pk=trabajo_id)
        entrada = ValidarTokenSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        try:
            token = services.validar_token(trabajo, request.user, entrada.validated_data["codigo"])
        except (PermissionDenied, ErrorDeValidacion, services.DemasiadosIntentos) as error:
            return respuesta_de_error(error)
        trabajo.refresh_from_db()
        return Response({
            "detalle": "Código validado correctamente.",
            "trabajo_estado": trabajo.estado,
            "token": TokenClienteSerializer(token).data,
        })


class RegenerarTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trabajo_id):
        trabajo = get_object_or_404(Trabajo, pk=trabajo_id)
        try:
            token = services.regenerar_token(trabajo, request.user)
        except (PermissionDenied, ErrorDeValidacion) as error:
            return respuesta_de_error(error)
        return Response(
            {"token": TokenTecnicoSerializer(token).data}, status=status.HTTP_201_CREATED
        )