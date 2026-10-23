from usuarios.permissions import EsTecnico

from .models import PerfilTecnico


class EsTecnicoAprobado(EsTecnico):
    message = "Esta acción requiere un técnico aprobado."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False

        try:
            perfil = request.user.perfil_tecnico
        except PerfilTecnico.DoesNotExist:
            return False

        return (
            perfil.estado_validacion
            == PerfilTecnico.EstadoValidacion.APROBADO
        )
