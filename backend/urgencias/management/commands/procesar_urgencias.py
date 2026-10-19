import logging
import time

from django.core.management.base import BaseCommand
from django.db import close_old_connections

from urgencias.services import procesar_pendientes

logger = logging.getLogger(__name__)
INTERVALO_SEGUNDOS = 10


class Command(BaseCommand):
    help = "Busca técnicos disponibles para urgencias pendientes cada 10 segundos."

    def handle(self, *args, **options):
        while True:
            close_old_connections()
            try:
                procesar_pendientes()
            except Exception:
                # Registra la traza y permite reintentar en el siguiente ciclo.
                logger.exception("Error al procesar las urgencias pendientes")
            time.sleep(INTERVALO_SEGUNDOS)
