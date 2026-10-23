from decimal import Decimal
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import connection, transaction
from django.utils import timezone
from solicitudes.models import Solicitud, Propuesta, Trabajo
from tecnicos.models import PerfilTecnico
from .models import Disponibilidad, Urgencia, Asignacion

TARIFA = Decimal("40000.00")


def bloquear_asignaciones():
    # Una cola pequeña serializada en PostgreSQL evita reservas simultáneas.
    # Siempre se adquiere antes que los bloqueos de Trabajo y Solicitud.
    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_advisory_xact_lock(73400291)")


def elegible(usuario):
    return (usuario.is_active and usuario.rol == "TECNICO" and
            PerfilTecnico.objects.filter(usuario=usuario, estado_validacion="APROBADO").exists())


@transaction.atomic
def cambiar_disponibilidad(usuario, activa):
    bloquear_asignaciones()
    if usuario.rol != "TECNICO":
        raise PermissionDenied("Solo técnicos pueden cambiar su disponibilidad.")
    if activa and not elegible(usuario):
        raise ValidationError("Tu perfil debe estar aprobado para atender urgencias.")
    if activa and Trabajo.objects.filter(tecnico=usuario, estado__in=["pendiente", "en_proceso"]).exists():
        raise ValidationError("Terminá o cancelá tu trabajo activo antes de habilitar urgencias.")
    disponibilidad, _ = Disponibilidad.objects.update_or_create(tecnico=usuario, defaults={"activa": activa, "desde": timezone.now()})
    procesar_pendientes()
    disponibilidad.refresh_from_db()
    return disponibilidad


def asignar(urgencia):
    if urgencia.estado != "buscando":
        return
    if not urgencia.especialidad.activa or not urgencia.zona.activa:
        return
    if not urgencia.cliente.is_active or urgencia.cliente.rol != "CLIENTE":
        urgencia.estado = "cancelada"
        urgencia.save(update_fields=["estado"])
        return
    excluidos = Asignacion.objects.filter(urgencia=urgencia).values_list("trabajo__tecnico_id", flat=True)
    ocupados = Trabajo.objects.filter(estado__in=["pendiente", "en_proceso"]).values_list("tecnico_id", flat=True)
    candidatos = Disponibilidad.objects.filter(
        activa=True, tecnico__is_active=True, tecnico__rol="TECNICO",
        tecnico__perfil_tecnico__estado_validacion="APROBADO",
        tecnico__perfil_tecnico__especialidades=urgencia.especialidad,
        tecnico__perfil_tecnico__zonas=urgencia.zona,
    ).exclude(tecnico_id__in=excluidos).exclude(tecnico_id__in=ocupados).exclude(tecnico_id=urgencia.cliente_id).order_by("desde", "pk")
    disponibilidad = candidatos.first()
    if disponibilidad is None:
        return
    tecnico = disponibilidad.tecnico
    solicitud = Solicitud.objects.create(
        cliente=urgencia.cliente, titulo="Urgencia: " + urgencia.especialidad.nombre,
        descripcion=urgencia.descripcion, especialidad=urgencia.especialidad,
        zona=urgencia.zona, direccion=urgencia.direccion, es_urgente=True,
    )
    propuesta = Propuesta.objects.create(
        solicitud=solicitud, tecnico=tecnico,
        descripcion_solucion="Visita urgente. Materiales y trabajos adicionales se acuerdan aparte.",
        precio=urgencia.tarifa_visita, fecha_disponible=timezone.localdate(),
    )
    from solicitudes.services import aceptar_propuesta
    trabajo = aceptar_propuesta(propuesta, urgencia.cliente)
    Asignacion.objects.create(urgencia=urgencia, trabajo=trabajo)
    Disponibilidad.objects.filter(pk=disponibilidad.pk).update(activa=False)
    urgencia.estado = "asignada"
    urgencia.save(update_fields=["estado"])


@transaction.atomic
def procesar_pendientes():
    bloquear_asignaciones()
    for urgencia in Urgencia.objects.filter(estado="buscando").select_related("cliente", "especialidad", "zona").order_by("creada_en", "pk"):
        if urgencia.especialidad.activa and urgencia.zona.activa:
            asignar(urgencia)


@transaction.atomic
def crear(usuario, datos):
    bloquear_asignaciones()
    if usuario.rol != "CLIENTE" or not usuario.is_active:
        raise PermissionDenied("Solo clientes activos pueden pedir urgencias.")
    if Urgencia.objects.filter(cliente=usuario, estado__in=["buscando", "asignada"]).exists():
        raise ValidationError("Ya tenés una urgencia activa. Consultala antes de crear otra.")
    urgencia = Urgencia.objects.create(cliente=usuario, tarifa_visita=TARIFA, **datos)
    asignar(urgencia)
    return urgencia


def actualizar_por_trabajo(trabajo, usuario):
    asignacion = Asignacion.objects.filter(trabajo=trabajo).select_related("urgencia").first()
    if not asignacion:
        return
    urgencia = asignacion.urgencia
    if trabajo.estado == "finalizado":
        urgencia.estado = "finalizada"
    elif trabajo.estado == "cancelado":
        urgencia.estado = "buscando" if usuario.pk == trabajo.tecnico_id else "cancelada"
    else:
        return
    urgencia.save(update_fields=["estado"])
    if urgencia.estado == "buscando":
        asignar(urgencia)


@transaction.atomic
def cancelar(urgencia, usuario):
    bloquear_asignaciones()
    urgencia.refresh_from_db()
    if usuario.pk != urgencia.cliente_id:
        raise PermissionDenied("La urgencia pertenece a otro cliente.")
    if urgencia.estado not in ["buscando", "asignada"]:
        raise ValidationError("La urgencia ya terminó.")
    asignacion = urgencia.asignaciones.order_by("-pk").first()
    if urgencia.estado == "asignada" and asignacion:
        from solicitudes.services import cambiar_estado_trabajo
        cambiar_estado_trabajo(asignacion.trabajo, usuario, "cancelado")
    else:
        urgencia.estado = "cancelada"
        urgencia.save(update_fields=["estado"])
    urgencia.refresh_from_db()
    return urgencia
