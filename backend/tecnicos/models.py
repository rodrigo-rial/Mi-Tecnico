from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models


LIMITE_DOCUMENTO_BYTES = 5 * 1024 * 1024


def validar_tamano_documento(archivo):
    if archivo.size > LIMITE_DOCUMENTO_BYTES:
        raise ValidationError("El archivo no puede superar los 5 MB.")


class Especialidad(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ("nombre",)
        verbose_name = "especialidad"
        verbose_name_plural = "especialidades"

    def __str__(self):
        return self.nombre


class Zona(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ("nombre",)
        verbose_name = "zona"
        verbose_name_plural = "zonas"

    def __str__(self):
        return self.nombre


class PerfilTecnico(models.Model):
    class EstadoValidacion(models.TextChoices):
        PENDIENTE = "PENDIENTE", "Pendiente"
        APROBADO = "APROBADO", "Aprobado"
        RECHAZADO = "RECHAZADO", "Rechazado"

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil_tecnico",
        limit_choices_to={"rol": "TECNICO"},
    )
    descripcion = models.TextField(blank=True)
    dni_numero = models.CharField(max_length=20, blank=True)
    matricula_numero = models.CharField(max_length=100, blank=True)
    documento_dni = models.FileField(
        upload_to="documentos_tecnicos/dni/",
        blank=True,
        validators=[
            FileExtensionValidator(["pdf", "jpg", "jpeg", "png"]),
            validar_tamano_documento,
        ],
    )
    documento_matricula = models.FileField(
        upload_to="documentos_tecnicos/matricula/",
        blank=True,
        validators=[
            FileExtensionValidator(["pdf", "jpg", "jpeg", "png"]),
            validar_tamano_documento,
        ],
    )
    especialidades = models.ManyToManyField(
        Especialidad,
        related_name="perfiles_tecnicos",
        blank=True,
    )
    zonas = models.ManyToManyField(
        Zona,
        related_name="perfiles_tecnicos",
        blank=True,
    )
    estado_validacion = models.CharField(
        max_length=15,
        choices=EstadoValidacion.choices,
        default=EstadoValidacion.PENDIENTE,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("usuario__username",)
        verbose_name = "perfil técnico"
        verbose_name_plural = "perfiles técnicos"

    @property
    def documentacion_completa(self):
        return all(
            (
                self.dni_numero,
                self.matricula_numero,
                self.documento_dni,
                self.documento_matricula,
            )
        )

    def clean(self):
        super().clean()
        errores = {}
        if self.usuario_id and self.usuario.rol != "TECNICO":
            errores["usuario"] = (
                "El perfil técnico requiere un usuario con rol TECNICO."
            )
        if self.estado_validacion == self.EstadoValidacion.APROBADO:
            campos_requeridos = {
                "dni_numero": "Ingresá el número de DNI antes de aprobar.",
                "matricula_numero": "Ingresá la matrícula antes de aprobar.",
                "documento_dni": "Cargá el documento de DNI antes de aprobar.",
                "documento_matricula": "Cargá el documento de matrícula antes de aprobar.",
            }
            for campo, mensaje in campos_requeridos.items():
                if not getattr(self, campo):
                    errores[campo] = mensaje
        if errores:
            raise ValidationError(errores)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Perfil técnico de {self.usuario.username}"
