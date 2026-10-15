from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model

from solicitudes.models import Propuesta, Solicitud, Trabajo
from tecnicos.models import Especialidad, Zona

User = get_user_model()


def crear_usuario(email, rol):
    return User.objects.create_user(
        username=email, email=email, password="Clave12345!", rol=rol
    )


def crear_trabajo(estado=Trabajo.Estado.FINALIZADO, tecnico=None, email_cliente="cliente@test.com"):
    cliente = crear_usuario(email_cliente, "CLIENTE")
    tecnico = tecnico or crear_usuario("tecnico@test.com", "TECNICO")
    especialidad, _ = Especialidad.objects.get_or_create(nombre="Plomería")
    zona, _ = Zona.objects.get_or_create(nombre="La Plata Centro")
    solicitud = Solicitud.objects.create(
        cliente=cliente,
        titulo="Pérdida de agua",
        descripcion="Canilla rota",
        especialidad=especialidad,
        zona=zona,
        direccion="Calle 1 123",
    )
    propuesta = Propuesta.objects.create(
        solicitud=solicitud,
        tecnico=tecnico,
        descripcion_solucion="Cambio de canilla",
        precio=Decimal("15000"),
        fecha_disponible=date.today(),
        estado=Propuesta.Estado.ACEPTADA,
    )
    return Trabajo.objects.create(
        solicitud=solicitud,
        propuesta=propuesta,
        cliente=cliente,
        tecnico=tecnico,
        precio_acordado=Decimal("15000"),
        estado=estado,
    )
