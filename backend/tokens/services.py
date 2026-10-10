"""Lógica de negocio del código de seguridad. No sabe nada de HTTP."""
import secrets
from datetime import timedelta

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from solicitudes.models import Trabajo

from .models import (
    DIAS_VIGENCIA_TOKEN,
    MAX_INTENTOS_FALLIDOS,
    MINUTOS_BLOQUEO,
    TokenTrabajo,
)

Estado = TokenTrabajo.Estado
ESTADOS_ACTIVOS = (Trabajo.Estado.PENDIENTE, Trabajo.Estado.EN_PROCESO)


class DemasiadosIntentos(Exception):
    """Se superó el máximo de intentos fallidos (la vista responde 429)."""


def _codigo_aleatorio():
    # secrets (no random): es aleatorio de calidad criptográfica.
    return f"{secrets.randbelow(1_000_000):06d}"


def ultimo_token(trabajo):
    return TokenTrabajo.objects.filter(trabajo=trabajo).order_by("-creado_en", "-id").first()


def actualizar_vencimiento(token):
    """Si el código generado ya pasó su fecha, queda 'vencido'."""
    if token.estado == Estado.GENERADO and token.vence_en <= timezone.now():
        token.estado = Estado.VENCIDO
        token.save(update_fields=["estado"])
    return token


def generar_token(trabajo):
    """Crea el código del trabajo. Si ya hay uno vigente, devuelve ese."""
    ahora = timezone.now()
    with transaction.atomic():
        vigente = TokenTrabajo.objects.filter(
            trabajo=trabajo, estado=Estado.GENERADO, vence_en__gt=ahora
        ).first()
        if vigente is not None:
            return vigente

        # Los 'generado' que quedan ya pasaron su fecha: se marcan vencidos.
        TokenTrabajo.objects.filter(trabajo=trabajo, estado=Estado.GENERADO).update(
            estado=Estado.VENCIDO
        )

        # Si el número ya lo usa otro código vigente, la BD lo rechaza y se prueba otro.
        for _ in range(10):
            try:
                with transaction.atomic():
                    return TokenTrabajo.objects.create(
                        trabajo=trabajo,
                        cliente_id=trabajo.cliente_id,
                        tecnico_id=trabajo.tecnico_id,
                        codigo=_codigo_aleatorio(),
                        vence_en=ahora + timedelta(days=DIAS_VIGENCIA_TOKEN),
                    )
            except IntegrityError:
                continue
    raise ValidationError("No se pudo generar el código. Intentá de nuevo.")


def cancelar_tokens(trabajo):
    TokenTrabajo.objects.filter(trabajo=trabajo, estado=Estado.GENERADO).update(
        estado=Estado.CANCELADO
    )


def obtener_o_generar_token(trabajo):
    """Token actual del trabajo. Si es un trabajo viejo sin código, lo genera."""
    token = ultimo_token(trabajo)
    if token is None:
        if trabajo.estado in ESTADOS_ACTIVOS:
            return generar_token(trabajo)
        return None
    return actualizar_vencimiento(token)


def regenerar_token(trabajo, usuario):
    """El técnico pide un código nuevo (por ejemplo si el anterior venció)."""
    # REGLA: solo el técnico asignado regenera.
    if usuario.pk != trabajo.tecnico_id:
        raise PermissionDenied("Solo el técnico del trabajo puede generar un código nuevo.")

    with transaction.atomic():
        trabajo = Trabajo.objects.select_for_update().get(pk=trabajo.pk)
        if trabajo.estado not in ESTADOS_ACTIVOS:
            raise ValidationError("El trabajo ya no admite código (finalizado o cancelado).")
        # REGLA: un código usado no se reutiliza ni se reemplaza.
        if TokenTrabajo.objects.filter(trabajo=trabajo, estado=Estado.VALIDADO).exists():
            raise ValidationError("La visita ya fue validada con un código.")
        cancelar_tokens(trabajo)
        return generar_token(trabajo)


def validar_token(trabajo, usuario, codigo):
    # REGLA: solo el cliente asociado al trabajo puede validar.
    if usuario.pk != trabajo.cliente_id:
        raise PermissionDenied("Solo el cliente del trabajo puede validar el código.")

    codigo = (codigo or "").strip()
    error = None  # mensaje para rechazar
    bloqueo = None  # mensaje si queda bloqueado

    # Los errores se lanzan DESPUÉS del bloque atomic: si no, Django desharía
    # los cambios (intentos fallidos, estado vencido) que sí queremos guardar.
    with transaction.atomic():
        trabajo = Trabajo.objects.select_for_update().get(pk=trabajo.pk)
        token = (
            TokenTrabajo.objects.select_for_update()
            .filter(trabajo=trabajo)
            .order_by("-creado_en", "-id")
            .first()
        )
        ahora = timezone.now()

        if token is None:
            error = "Este trabajo no tiene código de seguridad."
        elif token.estado == Estado.VALIDADO:
            error = "Este código ya fue utilizado."  # REGLA: no reutilizable
        elif token.estado == Estado.CANCELADO:
            error = "Este código fue cancelado."
        else:
            actualizar_vencimiento(token)
            if token.estado == Estado.VENCIDO:
                error = "El código venció. Pedile al técnico que genere uno nuevo."
            elif token.bloqueado_hasta and token.bloqueado_hasta > ahora:
                bloqueo = f"Demasiados intentos. Probá de nuevo en {MINUTOS_BLOQUEO} minutos."
            elif trabajo.estado not in ESTADOS_ACTIVOS:
                error = "El trabajo ya no admite validación (finalizado o cancelado)."
            elif token.tecnico_id != trabajo.tecnico_id:
                # REGLA: el código debe corresponder al técnico asignado.
                error = "El código no corresponde al técnico asignado."
            elif not secrets.compare_digest(token.codigo.encode(), codigo.encode()):
                token.intentos_fallidos += 1
                if token.intentos_fallidos >= MAX_INTENTOS_FALLIDOS:
                    token.intentos_fallidos = 0
                    token.bloqueado_hasta = ahora + timedelta(minutes=MINUTOS_BLOQUEO)
                    bloqueo = (
                        "Superaste los intentos permitidos. "
                        f"Probá de nuevo en {MINUTOS_BLOQUEO} minutos."
                    )
                else:
                    restantes = MAX_INTENTOS_FALLIDOS - token.intentos_fallidos
                    error = f"Código incorrecto. Te quedan {restantes} intentos."
                token.save(update_fields=["intentos_fallidos", "bloqueado_hasta"])
            else:
                # Código correcto: queda validado con fecha y hora.
                token.estado = Estado.VALIDADO
                token.validado_en = ahora
                token.intentos_fallidos = 0
                token.save(update_fields=["estado", "validado_en", "intentos_fallidos"])
                # T3: validar la visita inicia el trabajo. Borrá este bloque si Int. 3 lo prefiere.
                if trabajo.estado == Trabajo.Estado.PENDIENTE:
                    trabajo.cambiar_estado(Trabajo.Estado.EN_PROCESO)
                return token

    if bloqueo:
        raise DemasiadosIntentos(bloqueo)
    raise ValidationError(error)