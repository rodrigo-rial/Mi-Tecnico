<<<<<<< HEAD
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
=======
"""Lógica de negocio de reputación. Sin HTTP: las views solo llaman a estas funciones."""
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied, ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Avg, Count
from PIL import Image

# SUPUESTO: la app de Trabajo se llama "solicitudes".
from solicitudes.models import Trabajo

from .models import Calificacion, FotoTrabajo

# Reglas del alcance (cambiar acá si el equipo decide otros límites)
MAX_FOTOS_POR_TRABAJO = 5
MAX_BYTES_FOTO = 5 * 1024 * 1024  # 5 MB
FORMATOS_PERMITIDOS = {"JPEG", "PNG", "WEBP"}


def _obtener_trabajo(trabajo_id):
    trabajo = Trabajo.objects.filter(pk=trabajo_id).first()
    if trabajo is None:
        raise ObjectDoesNotExist("El trabajo no existe.")
    return trabajo


# ---------- Calificaciones ----------

def crear_calificacion(*, autor, trabajo_id, puntaje, comentario=""):
    trabajo = _obtener_trabajo(trabajo_id)

    # Solo participantes reales del trabajo
    if not trabajo.es_participante(autor):
        raise PermissionDenied("Solo el cliente o el técnico del trabajo pueden calificar.")

    # Solo cuando el trabajo está finalizado
    if trabajo.estado != Trabajo.Estado.FINALIZADO:
        raise ValidationError("Solo se puede calificar un trabajo finalizado.")

    # El destinatario es siempre la otra parte del trabajo
    if autor.pk == trabajo.cliente_id:
        destinatario_id = trabajo.tecnico_id
    else:
        destinatario_id = trabajo.cliente_id

    # No se puede calificar a uno mismo
    if destinatario_id == autor.pk:
        raise ValidationError("No podés calificarte a vos mismo.")

    # Puntaje de 1 a 5
    if not (1 <= puntaje <= 5):
        raise ValidationError("El puntaje debe estar entre 1 y 5.")

    # Una calificación por autor y trabajo
    if Calificacion.objects.filter(trabajo=trabajo, autor=autor).exists():
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
        raise ValidationError("Ya calificaste este trabajo.")

    try:
        with transaction.atomic():
            return Calificacion.objects.create(
                trabajo=trabajo,
                autor=autor,
<<<<<<< HEAD
                destinatario=destinatario,
=======
                destinatario_id=destinatario_id,
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
                puntaje=puntaje,
                comentario=comentario,
            )
    except IntegrityError:
<<<<<<< HEAD
        raise ValidationError("Ya calificaste este trabajo.")


def resumen_reputacion(usuario):
    """Promedio y cantidad de calificaciones RECIBIDAS por el usuario."""
    datos = Calificacion.objects.filter(destinatario=usuario).aggregate(
=======
        # Dos pedidos simultáneos: la restricción de la BD evita el duplicado.
        raise ValidationError("Ya calificaste este trabajo.")


def calificaciones_de_trabajo(*, usuario, trabajo_id):
    trabajo = _obtener_trabajo(trabajo_id)
    if not trabajo.es_participante(usuario):
        raise PermissionDenied("Solo los participantes pueden ver las calificaciones del trabajo.")
    return trabajo.calificaciones.select_related("autor", "destinatario")


def resumen_reputacion(usuario_id):
    """Promedio y cantidad de calificaciones RECIBIDAS por un usuario."""
    if not get_user_model().objects.filter(pk=usuario_id).exists():
        raise ObjectDoesNotExist("El usuario no existe.")
    datos = Calificacion.objects.filter(destinatario_id=usuario_id).aggregate(
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
        promedio=Avg("puntaje"), cantidad=Count("id")
    )
    promedio = datos["promedio"]
    return {
<<<<<<< HEAD
=======
        "usuario": usuario_id,
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
        "promedio": round(promedio, 2) if promedio is not None else None,
        "cantidad": datos["cantidad"],
    }


<<<<<<< HEAD
def subir_foto(trabajo, usuario, imagen, descripcion=""):
    if usuario.pk != trabajo.tecnico_id:
        raise PermissionDenied("Solo el técnico del trabajo puede subir fotos.")

    if trabajo.estado != Trabajo.Estado.FINALIZADO:
        raise ValidationError("Solo se pueden subir fotos de un trabajo finalizado.")

    with transaction.atomic():
        Trabajo.objects.select_for_update().get(pk=trabajo.pk)

        if FotoTrabajo.objects.filter(trabajo=trabajo).count() >= MAX_FOTOS_POR_TRABAJO:
=======
# ---------- Fotos ----------

def _validar_imagen(imagen):
    if imagen.size > MAX_BYTES_FOTO:
        raise ValidationError("La foto supera el tamaño máximo de 5 MB.")
    try:
        formato = Image.open(imagen).format
    except Exception:
        raise ValidationError("El archivo no es una imagen válida.")
    imagen.seek(0)  # volvemos al inicio para poder guardarla
    if formato not in FORMATOS_PERMITIDOS:
        raise ValidationError("Formato no permitido. Usá JPG, PNG o WEBP.")


def subir_foto(*, usuario, trabajo_id, imagen, descripcion=""):
    # El lock evita que dos subidas simultáneas superen el límite de fotos.
    with transaction.atomic():
        trabajo = Trabajo.objects.select_for_update().filter(pk=trabajo_id).first()
        if trabajo is None:
            raise ObjectDoesNotExist("El trabajo no existe.")

        # Solo el técnico del trabajo sube fotos
        if usuario.pk != trabajo.tecnico_id:
            raise PermissionDenied("Solo el técnico del trabajo puede subir fotos.")

        # SUPUESTO: "trabajo terminado" = estado finalizado
        if trabajo.estado != Trabajo.Estado.FINALIZADO:
            raise ValidationError("Solo se pueden subir fotos de un trabajo finalizado.")

        # Límite de cantidad por trabajo
        if trabajo.fotos.count() >= MAX_FOTOS_POR_TRABAJO:
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
            raise ValidationError(
                f"Se alcanzó el máximo de {MAX_FOTOS_POR_TRABAJO} fotos por trabajo."
            )

<<<<<<< HEAD
        return FotoTrabajo.objects.create(
            trabajo=trabajo, tecnico=usuario, imagen=imagen, descripcion=descripcion
        )
=======
        _validar_imagen(imagen)
        # La foto queda ligada al trabajo desde la creación (pertenece al trabajo)
        return FotoTrabajo.objects.create(
            trabajo=trabajo, imagen=imagen, descripcion=descripcion
        )


def fotos_de_trabajo(trabajo_id):
    return _obtener_trabajo(trabajo_id).fotos.all()


def fotos_de_tecnico(tecnico_id):
    """Historial profesional: fotos de todos los trabajos finalizados del técnico."""
    return FotoTrabajo.objects.filter(
        trabajo__tecnico_id=tecnico_id, trabajo__estado=Trabajo.Estado.FINALIZADO
    )
>>>>>>> 5ed7080eaf069d6f17c85e77305d00f8c13c7308
