import time
from django.core.management.base import BaseCommand
from django.db import close_old_connections
from urgencias.services import procesar_pendientes

class Command(BaseCommand):
    help = "Busca técnicos disponibles para urgencias pendientes cada 10 segundos."
    def handle(self, *args, **options):
        while True:
            close_old_connections()
            try:
                procesar_pendientes()
            except Exception as error:
                self.stderr.write(str(error))
            time.sleep(10)
