from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from usuarios.permissions import EsTecnico

from .models import Especialidad, PerfilTecnico, Zona
from .serializers import (
    EspecialidadSerializer,
    PerfilTecnicoSerializer,
    ZonaSerializer,
)


class EspecialidadListView(generics.ListAPIView):
    queryset = Especialidad.objects.filter(activa=True)
    serializer_class = EspecialidadSerializer
    permission_classes = [IsAuthenticated]


class ZonaListView(generics.ListAPIView):
    queryset = Zona.objects.filter(activa=True)
    serializer_class = ZonaSerializer
    permission_classes = [IsAuthenticated]


class PerfilTecnicoView(APIView):
    permission_classes = [EsTecnico]

    def get_perfil(self, usuario):
        return get_object_or_404(PerfilTecnico, usuario=usuario)

    def get(self, request):
        perfil = self.get_perfil(request.user)
        serializer = PerfilTecnicoSerializer(perfil)
        return Response(serializer.data)

    def post(self, request):
        if PerfilTecnico.objects.filter(usuario=request.user).exists():
            return Response(
                {"detail": "El usuario ya tiene un perfil técnico."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PerfilTecnicoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(usuario=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        perfil = self.get_perfil(request.user)
        serializer = PerfilTecnicoSerializer(
            perfil,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
