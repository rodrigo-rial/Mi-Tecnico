from unittest.mock import patch

from django.test import SimpleTestCase

from .management.commands import procesar_urgencias as worker


class WorkerUrgenciasTests(SimpleTestCase):
    def test_registra_traza_y_continua_tras_un_error(self):
        fallo = RuntimeError("Fallo simulado")
        with (
            patch.object(worker, "close_old_connections"),
            patch.object(worker, "procesar_pendientes", side_effect=[fallo, None]) as procesar,
            patch.object(worker.time, "sleep", side_effect=[None, KeyboardInterrupt]) as pausa,
            self.assertLogs(worker.logger, level="ERROR") as registros,
        ):
            with self.assertRaises(KeyboardInterrupt):
                worker.Command().handle()

        self.assertEqual(procesar.call_count, 2)
        self.assertEqual(pausa.call_count, 2)
        pausa.assert_called_with(10)
        self.assertEqual(len(registros.records), 1)
        self.assertIs(registros.records[0].exc_info[1], fallo)
        self.assertIsNotNone(registros.records[0].exc_info[2])

    def test_no_oculta_la_interrupcion_del_operador(self):
        with (
            patch.object(worker, "close_old_connections"),
            patch.object(worker, "procesar_pendientes", side_effect=KeyboardInterrupt),
            patch.object(worker.time, "sleep") as pausa,
            patch.object(worker.logger, "exception") as registrar,
        ):
            with self.assertRaises(KeyboardInterrupt):
                worker.Command().handle()

        pausa.assert_not_called()
        registrar.assert_not_called()
