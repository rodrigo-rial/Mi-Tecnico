from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Usuario
from .permissions import EsAdministrador, EsCliente, EsTecnico
from .serializers import RegistroUsuarioSerializer, UsuarioActualSerializer


class RegistroUsuarioView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [AllowAny]


class UsuarioActualView(generics.RetrieveAPIView):
    serializer_class = UsuarioActualSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class AccesoClienteView(APIView):
    permission_classes = [EsCliente]

    def get(self, request):
        return Response(
            {
                "mensaje": "Acceso autorizado para cliente.",
                "usuario": request.user.username,
                "rol": request.user.rol,
            }
        )


class AccesoTecnicoView(APIView):
    permission_classes = [EsTecnico]

    def get(self, request):
        return Response(
            {
                "mensaje": "Acceso autorizado para técnico.",
                "usuario": request.user.username,
                "rol": request.user.rol,
            }
        )


class AccesoAdministradorView(APIView):
    permission_classes = [EsAdministrador]

    def get(self, request):
        return Response(
            {
                "mensaje": "Acceso autorizado para administrador.",
                "usuario": request.user.username,
                "rol": request.user.rol,
            }
        )