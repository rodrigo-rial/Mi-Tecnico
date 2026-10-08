from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from rest_framework.exceptions import Throttled
from .models import TokenTrabajo
from .serializers import (
    TokenTecnicoSerializer, 
    TokenClienteSerializer, 
    ValidarTokenSerializer
)
from .services import TokenService

class TokenTrabajoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return TokenTrabajo.objects.filter(
            trabajo__solicitud__cliente=user
        ) | TokenTrabajo.objects.filter(
            trabajo__propuesta__tecnico=user
        )

    def get_serializer_class(self):
        # Si el usuario es el técnico del trabajo, se le permite ver el código
        trabajo = getattr(self.get_object(), 'trabajo', None) if self.detail else None
        if trabajo and trabajo.propuesta.tecnico == self.request.user:
            return TokenTecnicoSerializer
        return TokenClienteSerializer

    @action(detail=True, methods=['post'], serializer_class=ValidarTokenSerializer)
    def validar(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        codigo = serializer.validated_data['codigo']
        try:
            TokenService.validar_token(trabajo_id=pk, codigo_ingresado=codigo)
            return Response({'status': 'Token validado con éxito. Trabajo iniciado.'}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)
        except Throttled as e:
            return Response({'error': str(e.detail)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
