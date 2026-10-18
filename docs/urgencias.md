# Canal de urgencias

## Alcance acordado

Esta implementación reemplaza la selección manual prevista inicialmente en Alcance V2 por asignación automática, según el acuerdo de esta entrega. No usa GPS, distancias ni tiempos estimados. Coinciden especialidad y zona declarada. Entre compatibles se prioriza al que lleva más tiempo disponible.

La visita cuesta ARS 40.000. No es el precio de una reparación completa: materiales y trabajos adicionales se acuerdan aparte y se pagan fuera de la plataforma. El servidor fija la tarifa; no toma el importe del navegador.

## Flujo

1. El técnico aprobado activa disponibilidad desde Solicitudes. Es independiente de los datos de validación del perfil.
2. El cliente toca el botón flotante Urgencia, completa los datos y confirma la tarifa.
3. Se busca un técnico activo, aprobado, disponible, con la especialidad y zona requeridas, sin trabajos pendientes o en proceso.
4. Se reserva al técnico desactivando su disponibilidad y se registra solicitud, propuesta automática, trabajo y código de seguridad. La propuesta automática documenta la tarifa autorizada por ambas partes; no espera respuesta manual.
5. El cliente valida el código cuando llega el técnico. Eso inicia el trabajo.
6. Si el técnico cancela, el trabajo y código quedan cancelados y el pedido vuelve a buscar. No se vuelve a elegir a un técnico que ya canceló ese mismo pedido.
7. Cada reemplazo tiene otro trabajo y otro código. El historial anterior se conserva, sin modificar los modelos compartidos Trabajo y Propuesta.
8. Si el cliente cancela desde Urgencias o desde el trabajo vigente, se detiene el pedido. La finalización del trabajo cierra la urgencia.

Solo puede haber una urgencia activa por cliente. Desactivar disponibilidad no cancela un trabajo ya asignado. Al terminar/cancelar, el técnico debe activarla nuevamente; no se reactiva automáticamente.

## Ejecución local

```powershell
docker compose exec backend python manage.py migrate
docker compose up -d --build urgencias_worker
```

El nuevo servicio urgencias_worker revisa cada 10 segundos los pedidos que buscan técnico, incluso con el navegador cerrado. También se busca al crear un pedido, activar disponibilidad y cancelar el técnico. Las pantallas actualizan el estado cada 5 segundos; no hay notificaciones push ni WebSockets. Docker y la base deben estar encendidos.

```powershell
docker compose logs --tail 30 urgencias_worker
docker compose exec backend python manage.py test urgencias
```

## API

- GET/POST /api/urgencias/: listar pedidos propios / crear (solo cliente).
- POST /api/urgencias/{id}/cancelar/: cancelar pedido propio y su trabajo vigente.
- GET/PATCH /api/urgencias/disponibilidad/: disponibilidad propia del técnico; PATCH recibe activa booleano.
- El seguimiento y token usan las API existentes de Trabajo y tokens.

## Concurrencia y límites

La asignación y los cambios de disponibilidad/estado usan un bloqueo transaccional asesor de PostgreSQL. La aceptación normal de propuestas comparte ese bloqueo, para no reservar simultáneamente al técnico por ambos canales. Una visita urgente activa impide aceptar otra propuesta normal de ese técnico. La cola está pensada para el volumen académico; serializa las asignaciones y no pretende ser un sistema de despacho de gran escala.

La restricción de base de datos evita dos urgencias activas por cliente. El test concurrente comprueba dos clientes compitiendo por un solo técnico. No se modifican trabajos históricos ni se usan datos reales en las pruebas.

## Prueba manual

Usar un técnico aprobado sin trabajos activos y un cliente de prueba. Activar disponibilidad y crear la urgencia para su especialidad/zona. Comprobar asignación, disponibilidad desactivada, código y finalización. Para probar reemplazo, activar un segundo técnico compatible antes de cancelar el primero. Sin candidatos, debe verse Buscando técnico; al activar otro, se asigna sin intervención del cliente. Cancelar desde el cliente debe detener toda búsqueda.

## Documentos de cierre

- [Adenda al alcance V2](adenda-alcance-v2-urgencias.md).
- [Registro de pruebas locales](acta-verificacion-local.md).
