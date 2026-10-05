from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

Usuario = get_user_model()


class EsCliente(BasePermission):
    message = "Solo un usuario con rol CLIENTE puede realizar esta acción."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and getattr(user, "rol", None) == Usuario.Rol.CLIENTE
        )


class EsTecnicoAprobado(BasePermission):
    message = "Solo técnicos con estado APROBADO pueden consultar solicitudes."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "rol", None) == Usuario.Rol.TECNICO
            and getattr(user, "estado", None) == ESTADO_APROBADO
        )


class EsPropietario(BasePermission):
    message = "Solo el cliente propietario puede realizar esta acción."

    def has_object_permission(self, request, view, obj):
        return obj.cliente == request.user