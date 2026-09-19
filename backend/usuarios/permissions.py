from rest_framework.permissions import BasePermission

from .models import Usuario


class EsCliente(BasePermission):
    message = "Esta funcion está disponible solamente para clientes."

    def has_permission(self, request, view):
        usuario = request.user

        return bool(
            usuario
            and usuario.is_authenticated
            and usuario.is_active
            and usuario.rol == Usuario.Rol.CLIENTE
        )


class EsTecnico(BasePermission):
    message = "Esta funcion esta disponible solamente para tecnicos."

    def has_permission(self, request, view):
        usuario = request.user

        return bool(
            usuario
            and usuario.is_authenticated
            and usuario.is_active
            and usuario.rol == Usuario.Rol.TECNICO
        )


class EsAdministrador(BasePermission):
    message = "Esta funcion esta disponible solamente para administradores."

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