from django.core.exceptions import ObjectDoesNotExist, PermissionDenied, ValidationError
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import (
    CalificacionCrearSerializer,
    CalificacionSerializer,
    FotoSubirSerializer,
    FotoTrabajoSerializer,
)


class ErroresDeServicioMixin:
    """Convierte las excepciones de services.py en respuestas HTTP con {"detalle": "..."}."""

    def handle_exception(self, exc):
        if isinstance(exc, PermissionDenied):
            mensaje = str(exc) or "No tenés permiso para esta acción."
            return Response({"detalle": mensaje}, status=status.HTTP_403_FORBIDDEN)
        if isinstance(exc, ObjectDoesNotExist):
            return Response({"detalle": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        if isinstance(exc, ValidationError):
            return Response(
                {"detalle": " ".join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST
            )
        return super().handle_exception(exc)


class CalificacionCrearView(ErroresDeServicioMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        datos = CalificacionCrearSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        calificacion = services.crear_calificacion(
            autor=request.user,
            trabajo_id=datos.validated_data["trabajo"],
            puntaje=datos.validated_data["puntaje"],
            comentario=datos.validated_data.get("comentario", ""),
        )
        return Response(
            CalificacionSerializer(calificacion).data, status=status.HTTP_201_CREATED
        )


class CalificacionesDeTrabajoView(ErroresDeServicioMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trabajo_id):
        calificaciones = services.calificaciones_de_trabajo(
            usuario=request.user, trabajo_id=trabajo_id
        )
        return Response(CalificacionSerializer(calificaciones, many=True).data)


class ReputacionDeUsuarioView(ErroresDeServicioMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        return Response(services.resumen_reputacion(usuario_id))


class FotosDeTrabajoView(ErroresDeServicioMixin, APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, trabajo_id):
        fotos = services.fotos_de_trabajo(trabajo_id)
        return Response(
            FotoTrabajoSerializer(fotos, many=True, context={"request": request}).data
        )

    def post(self, request, trabajo_id):
        datos = FotoSubirSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        foto = services.subir_foto(
            usuario=request.user,
            trabajo_id=trabajo_id,
            imagen=datos.validated_data["imagen"],
            descripcion=datos.validated_data.get("descripcion", ""),
        )
        return Response(
            FotoTrabajoSerializer(foto, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class FotosDeTecnicoView(ErroresDeServicioMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, tecnico_id):
        fotos = services.fotos_de_tecnico(tecnico_id)
        return Response(
            FotoTrabajoSerializer(fotos, many=True, context={"request": request}).data
        )