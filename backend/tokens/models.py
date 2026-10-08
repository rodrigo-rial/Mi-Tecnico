import secrets
from django.db import models
from django.utils import timezone
from datetime import timedelta
from solicitudes.models import Trabajo

def generar_codigo_6_digitos():
    return f"{secrets.randbelow(1000000):06d}"

class TokenTrabajo(models.Model):
    trabajo = models.OneToOneField(
        Trabajo, 
        on_delete=models.CASCADE, 
        related_name='token_validacion'
    )
    codigo = models.CharField(max_length=6, default=generar_codigo_6_digitos)
    creado_en = models.DateTimeField(auto_now_add=True)
    expira_en = models.DateTimeField()
    intentos_fallidos = models.IntegerField(default=0)
    es_valido = models.BooleanField(default=True)

    class Meta:
        db_table = 'tokens_trabajo'
        verbose_name = 'Token de Trabajo'
        verbose_name_plural = 'Tokens de Trabajo'

    def save(self, *args, **kwargs):
        if not self.expira_en:
            # Expira en 24 horas por defecto
            self.expira_en = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def esta_expirado(self):
        return timezone.now() > self.expira_en

    def registrar_intento_fallido(self):
        self.intentos_fallidos += 1
        if self.intentos_fallidos >= 5:
            self.es_valido = False
        self.save(update_fields=['intentos_fallidos', 'es_valido'])
