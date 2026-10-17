from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    class Rol(models.TextChoices):
        CLIENTE = "CLIENTE", "Cliente"
        TECNICO = "TECNICO", "Tecnico"
        ADMINISTRADOR = "ADMINISTRADOR", "Administrador"

    telefono = models.CharField(max_length=30, blank=True, default="")
    domicilio_referencia = models.CharField(max_length=255, blank=True, default="")
    email = models.EmailField(unique=True)
    rol = models.CharField(
        max_length=20,
        choices=Rol.choices,
        default=Rol.CLIENTE,
    )

    def __str__(self):
        return f"{self.username} - {self.get_rol_display()}"