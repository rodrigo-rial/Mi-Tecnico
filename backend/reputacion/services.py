"""Lógica de negocio de reputación. No sabe nada de HTTP."""
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Avg, Count

from solicitudes.models import Trabajo

from .models import MAX_FOTOS_POR_TRABAJO, Calificacion, FotoTrabajo


def ya_califico(trabajo, usuario):
    return Calificacion.objects.filter(trabajo=trabajo, autor=usuario).exists()


def contraparte_de(trabajo, usuario):
    """El 'otro' participante del trabajo."""
    return trabajo.tecnico if usuario.pk == trabajo.cliente_id else trabajo.cliente


def crear_calificacion(trabajo, autor, puntaje, comentario=""):
    if not trabajo.es_participante(autor):
        raise PermissionDenied("Solo los participantes del trabajo pueden calificar.")

    if trabajo.estado != Trabajo.Estado.FINALIZADO:
        raise ValidationError("Solo se puede calificar un trabajo finalizado.")

    if not 1 <= puntaje <= 5:
        raise ValidationError("El puntaje debe estar entre 1 y 5.")

    destinatario = contraparte_de(trabajo, autor)

    if destinatario.pk == autor.pk:
        raise ValidationError("No podés calificarte a vos mismo.")

    if ya_califico(trabajo, autor):
        raise ValidationError("Ya calificaste este trabajo.")

    try:
        with transaction.atomic():
            return Calificacion.objects.create(
                trabajo=trabajo,
                autor=autor,
                destinatario=destinatario,
                puntaje=puntaje,
                comentario=comentario,
            )
    except IntegrityError:
        raise ValidationError("Ya calificaste este trabajo.")


def resumen_reputacion(usuario):
    """Promedio y cantidad de calificaciones RECIBIDAS por el usuario."""
    datos = Calificacion.objects.filter(destinatario=usuario).aggregate(
        promedio=Avg("puntaje"), cantidad=Count("id")
    )
    promedio = datos["promedio"]
    return {
        "promedio": round(promedio, 2) if promedio is not None else None,
        "cantidad": datos["cantidad"],
    }


def subir_foto(trabajo, usuario, imagen, descripcion=""):
    if usuario.pk != trabajo.tecnico_id:
        raise PermissionDenied("Solo el técnico del trabajo puede subir fotos.")

    if trabajo.estado != Trabajo.Estado.FINALIZADO:
        raise ValidationError("Solo se pueden subir fotos de un trabajo finalizado.")

    with transaction.atomic():
        Trabajo.objects.select_for_update().get(pk=trabajo.pk)

        if FotoTrabajo.objects.filter(trabajo=trabajo).count() >= MAX_FOTOS_POR_TRABAJO:
            raise ValidationError(
                f"Se alcanzó el máximo de {MAX_FOTOS_POR_TRABAJO} fotos por trabajo."
            )

        return FotoTrabajo.objects.create(
            trabajo=trabajo, tecnico=usuario, imagen=imagen, descripcion=descripcion
        )
