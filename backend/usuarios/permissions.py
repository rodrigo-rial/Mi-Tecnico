from rest_framework.permissions import BasePermission

from .models import Usuario


class EsCliente(BasePermission):
    message = "Esta función está disponible solamente para clientes."

    def has_permission(self, request, view):
        usuario = request.user

        return bool(
            usuario
            and usuario.is_authenticated
            and usuario.is_active
            and usuario.rol == Usuario.Rol.CLIENTE
        )


class EsTecnico(BasePermission):
    message = "Esta función está disponible solamente para técnicos."

    def has_permission(self, request, view):
        usuario = request.user

        return bool(
            usuario
            and usuario.is_authenticated
            and usuario.is_active
            and usuario.rol == Usuario.Rol.TECNICO
        )


class EsAdministrador(BasePermission):
    message = "Esta función está disponible solamente para administradores."

    def has_permission(self, request, view):
        usuario = request.user

        return bool(
            usuario
            and usuario.is_authenticated
            and usuario.is_active
            and (
                usuario.rol == Usuario.Rol.ADMINISTRADOR
                or usuario.is_superuser
            )
        )