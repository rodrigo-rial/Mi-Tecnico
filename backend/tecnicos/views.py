from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from usuarios.permissions import EsTecnico

from .models import Especialidad, PerfilTecnico, Zona
from .serializers import (
    DocumentacionTecnicoSerializer,
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


class DocumentacionTecnicoView(APIView):
    permission_classes = [EsTecnico]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_perfil(self, usuario):
        return get_object_or_404(PerfilTecnico, usuario=usuario)

    def get(self, request):
        perfil = self.get_perfil(request.user)
        serializer = DocumentacionTecnicoSerializer(perfil)
        return Response(serializer.data)

    def patch(self, request):
        perfil = self.get_perfil(request.user)
        serializer = DocumentacionTecnicoSerializer(
            perfil,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PerfilProfesionalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        from django.db.models import Avg, Count
        from reputacion.models import Calificacion, FotoTrabajo
        perfil = get_object_or_404(
            PerfilTecnico.objects.select_related("usuario"),
            usuario_id=usuario_id, usuario__is_active=True,
            usuario__rol="TECNICO", estado_validacion="APROBADO",
        )
        calificaciones = Calificacion.objects.filter(
            destinatario_id=usuario_id, trabajo__estado="finalizado",
        )
        resumen = calificaciones.aggregate(promedio=Avg("puntaje"), cantidad=Count("id"))
        fotos = FotoTrabajo.objects.filter(trabajo__tecnico_id=usuario_id, trabajo__estado="finalizado")[:50]
        return Response({
            "id": usuario_id,
            "nombre": perfil.usuario.get_full_name() or perfil.usuario.username,
            "descripcion": perfil.descripcion,
            "especialidades": list(perfil.especialidades.values_list("nombre", flat=True)),
            "zonas": list(perfil.zonas.values_list("nombre", flat=True)),
            "especialidad_ids": list(perfil.especialidades.filter(activa=True).values_list("id", flat=True)),
            "zona_ids": list(perfil.zonas.filter(activa=True).values_list("id", flat=True)),
            "reputacion": resumen,
            "resenas": list(calificaciones.values("id", "puntaje", "comentario", "created_at")[:50]),
            "fotos": [{"id": foto.pk, "imagen": request.build_absolute_uri(foto.imagen.url),
                       "descripcion": foto.descripcion} for foto in fotos],
        })
