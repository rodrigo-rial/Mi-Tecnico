from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Usuario
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