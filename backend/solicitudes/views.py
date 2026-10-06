from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError as DjangoValidationError

from .serializers import SolicitudSerializer, a_error_drf, PropuestaSerializer
from .permissions import EsCliente, EsPropietario, EsTecnicoAprobado, EsCliente
from .models import Solicitud, Propuesta
from django.db import IntegrityError
from rest_framework.views import APIView

Usuario = get_user_model()


class SolicitudViewSet(viewsets.ReadOnlyModelViewSet, viewsets.mixins.CreateModelMixin):
    serializer_class = SolicitudSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), EsCliente()]
        if self.action == "cancelar":
            return [IsAuthenticated(), EsCliente(), EsPropietario()]
        # list y retrieve
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Solicitud.objects.none()

        if getattr(user, "rol", None) == Usuario.Rol.CLIENTE:
            return Solicitud.objects.filter(cliente=user)

        if getattr(user, "rol", None) == Usuario.Rol.TECNICO:
            # Requisito de la consigna: técnicos usan compatibles_para
            return Solicitud.compatibles_para(user)

        return Solicitud.objects.none()

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)

    @action(detail=True, methods=["post"])
    def cancelar(self, request, pk=None):
        solicitud = self.get_object()  # Lanza 404 si no está en queryset y corre object permissions
        try:
            solicitud.cancelar(request.user)
            solicitud.save()
            return Response(
                {"mensaje": "Solicitud cancelada correctamente."},
                status=status.HTTP_200_OK,
            )
        except (DjangoValidationError, ValueError) as exc:
            raise a_error_drf(exc)

    @action(detail=True, methods=["get", "post"], url_path="propuestas")
    def propuestas(self, request, pk=None):
        solicitud = get_object_or_404(Solicitud, pk=pk)

        # GET: Solo el cliente dueño de la solicitud puede ver las propuestas
        if request.method == "GET":
            if not solicitud.es_propietario(request.user):
                return Response(
                    {"detail": "No tienes permiso para ver las propuestas de esta solicitud."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            propuestas = solicitud.propuestas.all()
            serializer = PropuestaSerializer(propuestas, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # POST: Solo técnicos aprobados y compatibles pueden enviar propuestas
        if request.method == "POST":
            # Validar permiso de rol básico
            if not EsTecnicoAprobado().has_permission(request, self):
                return Response(
                    {"detail": "Solo técnicos aprobados pueden enviar propuestas."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Verificar si ya existe propuesta de este técnico para evitar 500 y devolver 400
            if Propuesta.objects.filter(solicitud=solicitud, tecnico=request.user).exists():
                return Response(
                    {"detail": "Ya has enviado una propuesta para esta solicitud."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = PropuestaSerializer(
                data=request.data,
                context={"request": request, "solicitud": solicitud, "tecnico": request.user},
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            try:
                serializer.save()
            except IntegrityError:
                return Response(
                    {"detail": "Error de integridad: propuesta duplicada."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)


class MisPropuestasView(APIView):
    permission_classes = [permissions.IsAuthenticated, EsTecnicoAprobado]

    def get(self, request):
        propuestas = Propuesta.objects.filter(tecnico=request.user).select_related("solicitud__especialidad", "solicitud__zona", "tecnico")
        serializer = PropuestaSerializer(propuestas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)