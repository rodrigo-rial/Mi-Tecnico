from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError as DjangoValidationError

from .serializers import SolicitudSerializer, a_error_drf
from .permissions import EsCliente, EsTecnicoAprobado, EsPropietario
from .models import Solicitud

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