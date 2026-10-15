<<<<<<< HEAD
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
=======
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied, ValidationError
from rest_framework import status
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

<<<<<<< HEAD
from solicitudes.models import Trabajo
from solicitudes.views_trabajos import ejecutar

from . import services
from .models import Calificacion, FotoTrabajo
from .serializers import (
    CalificacionCrearSerializer,
    CalificacionSerializer,
    FotoCrearSerializer,
    FotoTrabajoSerializer,
)

User = get_user_model()


def exigir_participante(trabajo, usuario):
    if not trabajo.es_participante(usuario):
        raise PermissionDenied("No sos participante de este trabajo.")


class CalificacionesDeTrabajoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trabajo_id):
        trabajo = get_object_or_404(Trabajo, pk=trabajo_id)
        exigir_participante(trabajo, request.user)

        finalizado = trabajo.estado == Trabajo.Estado.FINALIZADO
        ya = services.ya_califico(trabajo, request.user)
        contraparte = services.contraparte_de(trabajo, request.user)
        calificaciones = trabajo.calificaciones.select_related("autor")

        return Response({
            "trabajo_id": trabajo.pk,
            "trabajo_finalizado": finalizado,
            "ya_califique": ya,
            "puedo_calificar": finalizado and not ya,
            "contraparte_id": contraparte.pk,
            "contraparte_nombre": contraparte.get_full_name(),
            "contraparte_username": contraparte.username,
            "calificaciones": CalificacionSerializer(calificaciones, many=True).data,
        })

    def post(self, request, trabajo_id):
        trabajo = get_object_or_404(Trabajo, pk=trabajo_id)
        entrada = CalificacionCrearSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        calificacion = ejecutar(
            services.crear_calificacion,
            trabajo,
            request.user,
            entrada.validated_data["puntaje"],
            entrada.validated_data["comentario"],
        )
        return Response(CalificacionSerializer(calificacion).data, status=status.HTTP_201_CREATED)


class ReputacionUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        usuario = get_object_or_404(User, pk=usuario_id)
        ultimas = Calificacion.objects.filter(destinatario=usuario).select_related("autor")[:10]
        return Response({
            "usuario_id": usuario.pk,
            "nombre": usuario.get_full_name(),
            "username": usuario.username,
            **services.resumen_reputacion(usuario),
            "ultimas_calificaciones": CalificacionSerializer(ultimas, many=True).data,
        })


class FotosDeTrabajoView(APIView):
=======
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
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, trabajo_id):
<<<<<<< HEAD
        trabajo = get_object_or_404(Trabajo, pk=trabajo_id)
        exigir_participante(trabajo, request.user)
        datos = FotoTrabajoSerializer(
            trabajo.fotos.all(), many=True, context={"request": request}
        ).data
        return Response(datos)

    def post(self, request, trabajo_id):
        trabajo = get_object_or_404(Trabajo, pk=trabajo_id)
        entrada = FotoCrearSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        foto = ejecutar(
            services.subir_foto,
            trabajo,
            request.user,
            entrada.validated_data["imagen"],
            entrada.validated_data["descripcion"],
        )
        datos = FotoTrabajoSerializer(foto, context={"request": request}).data
        return Response(datos, status=status.HTTP_201_CREATED)


class FotosDeUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        usuario = get_object_or_404(User, pk=usuario_id)
        fotos = FotoTrabajo.objects.filter(tecnico=usuario)[:50]
        datos = FotoTrabajoSerializer(fotos, many=True, context={"request": request}).data
        return Response(datos)
=======
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
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
