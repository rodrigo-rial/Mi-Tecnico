"""
Reglas de negocio del módulo Oferta

Cada función corre dentro de una transacción: o se aplican todos los
cambios, o ninguno. Las vistas solo llaman a estas funciones y traducen
los errores a respuestas HTTP.
"""
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction

from .models import Propuesta, Solicitud, Trabajo


@transaction.atomic
def aceptar_propuesta(propuesta, usuario):
    """El cliente dueño acepta una propuesta.

    - La propuesta elegida pasa a 'aceptada'.
    - Las demás de la solicitud pasan a 'rechazada'.
    - La solicitud pasa a 'asignada'.
    - Se crea el Trabajo con el precio de la propuesta.
    """
    # Se bloquea la solicitud: si dos aceptaciones llegan a la vez, la
    # segunda espera y después ve la solicitud ya asignada.
    solicitud = Solicitud.objects.select_for_update().get(pk=propuesta.solicitud_id)
    propuesta = Propuesta.objects.select_related("tecnico").get(pk=propuesta.pk)

    if not solicitud.es_propietario(usuario):
        raise PermissionDenied("Solo el dueño de la solicitud puede aceptar propuestas.")
    if solicitud.estado != Solicitud.Estado.PUBLICADA:
        raise ValidationError(
            "La solicitud ya no admite aceptar propuestas (no está publicada)."
        )
    if propuesta.estado != Propuesta.Estado.PENDIENTE:
        raise ValidationError("Solo se puede aceptar una propuesta pendiente.")

    solicitud.propuestas.exclude(pk=propuesta.pk).update(
        estado=Propuesta.Estado.RECHAZADA
    )
    propuesta.estado = Propuesta.Estado.ACEPTADA
    propuesta.save(update_fields=["estado"])

    solicitud.estado = Solicitud.Estado.ASIGNADA
    solicitud.save(update_fields=["estado"])

    trabajo = Trabajo(
        solicitud=solicitud,
        propuesta=propuesta,
        cliente_id=solicitud.cliente_id,
        tecnico_id=propuesta.tecnico_id,
        precio_acordado=propuesta.precio,
    )
    trabajo.full_clean()
    trabajo.save()
    return trabajo


@transaction.atomic
def rechazar_propuesta(propuesta, usuario):
    """El cliente dueño rechaza una propuesta pendiente (sin asignar)."""
    solicitud = Solicitud.objects.select_for_update().get(pk=propuesta.solicitud_id)
    propuesta = Propuesta.objects.get(pk=propuesta.pk)

    if not solicitud.es_propietario(usuario):
        raise PermissionDenied("Solo el dueño de la solicitud puede rechazar propuestas.")
    if propuesta.estado != Propuesta.Estado.PENDIENTE:
        raise ValidationError("Solo se puede rechazar una propuesta pendiente.")

    propuesta.estado = Propuesta.Estado.RECHAZADA
    propuesta.save(update_fields=["estado"])
    return propuesta


# Quién puede llevar el trabajo a cada estado
ROLES_POR_ESTADO = {
    Trabajo.Estado.EN_PROCESO: {"tecnico"},
    Trabajo.Estado.FINALIZADO: {"tecnico"},
    Trabajo.Estado.CANCELADO: {"cliente", "tecnico"},
}


@transaction.atomic
def cambiar_estado_trabajo(trabajo, usuario, nuevo_estado):
    """Cambia el estado de un trabajo respetando rol y transiciones.

    Mantiene sincronizada la solicitud: finalizado -> 'finalizada',
    cancelado -> 'cancelada'.
    """
    trabajo = (
        Trabajo.objects.select_for_update().select_related("solicitud").get(pk=trabajo.pk)
    )

    if usuario.pk == trabajo.tecnico_id:
        rol = "tecnico"
    elif usuario.pk == trabajo.cliente_id:
        rol = "cliente"
    else:
        raise PermissionDenied("No participás en este trabajo.")

    try:
        nuevo = Trabajo.Estado(nuevo_estado)
    except ValueError:
        raise ValidationError("Estado de trabajo inválido.")

    if rol not in ROLES_POR_ESTADO.get(nuevo, set()):
        raise PermissionDenied(
            f"Un {rol.upper()} no puede pasar el trabajo a '{nuevo.value}'."
        )

    # TODO (Integrante 4): para pasar a EN_PROCESO se puede exigir acá que
    # el token de la visita esté validado.
    trabajo.cambiar_estado(nuevo)  # valida la transición

    solicitud = trabajo.solicitud
    if nuevo == Trabajo.Estado.FINALIZADO:
        solicitud.estado = Solicitud.Estado.FINALIZADA
        solicitud.save(update_fields=["estado"])
    elif nuevo == Trabajo.Estado.CANCELADO:
        solicitud.estado = Solicitud.Estado.CANCELADA
        solicitud.save(update_fields=["estado"])

    return trabajo