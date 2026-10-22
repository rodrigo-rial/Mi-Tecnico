# Adenda al alcance V2: urgencias automáticas

Fecha: 18/10/2026. Proyecto MiTécnico, Desarrollo de Software, UTN-FRLP, S31.

## Objeto

Documentar la variante de urgencias solicitada expresamente por Pablo durante el
desarrollo y ratificada para esta entrega. Se adjunta al documento
MiTécnico - Alcance.V2.pdf, sin modificar su archivo original. No implica por sí
misma aprobación formal del resto del grupo o de la cátedra.

Sustituye el flujo de aceptación manual del módulo 5 y la referencia a ese flujo
en la integración del módulo 8. El resto del alcance V2 se mantiene. La selección
manual de propuestas continúa vigente para solicitudes normales.

## Texto actualizado del canal de urgencias

El cliente solicita una visita urgente indicando especialidad, zona, domicilio y
descripción. Antes de confirmar se informa una tarifa de visita de ARS 40.000.
La tarifa no incluye materiales ni reparaciones adicionales: se acuerdan entre
cliente y técnico y se abonan fuera de MiTécnico. No se procesa ningún cobro en la app.

El técnico aprobado puede activar o desactivar su disponibilidad inmediata. Al
activarla acepta recibir asignaciones automáticas bajo las condiciones informadas.
Para asignar se requiere un usuario técnico activo, perfil aprobado, disponibilidad
activa, especialidad y zona coincidentes y ausencia de trabajos pendientes o en proceso.
No se elige nuevamente a un técnico que haya cancelado la misma urgencia.

Entre los candidatos se prioriza quien lleva más tiempo disponible, con desempate
por identificador de disponibilidad. La coincidencia de zona no expresa una
distancia real ni garantiza que sea el técnico geográficamente más cercano.

La confirmación inicial del cliente autoriza la búsqueda y asignación: no se espera
una nueva aceptación del técnico ni confirmación posterior del cliente para
registrar el trabajo. Si no hay candidato, la urgencia permanece buscando técnico.

La asignación registra la solicitud, una propuesta automática que documenta la
visita, el trabajo y su código de seguridad. Desactiva la disponibilidad del técnico.
El técnico muestra el código al llegar; solo el cliente del trabajo puede validarlo
para pasar a en proceso. Finalizado el trabajo, se habilitan reputación y fotos
según las reglas generales.

## Cancelaciones, reemplazos y estados

- Solo puede existir una urgencia activa por cliente y una asignación vigente por pedido.
- Si el técnico cancela, el trabajo y su código se cancelan, y se busca otro candidato.
- Cada reemplazo genera un nuevo trabajo y código; el historial se conserva.
- Si el cliente cancela, se detiene la búsqueda y se cancela el trabajo vigente cuando
  su estado lo permite. No se permite cancelar un trabajo ya finalizado.
- Desactivar disponibilidad no cancela un trabajo asignado. Al terminar o cancelar,
  el técnico debe volver a activarla si desea recibir otra urgencia.
- Estados de urgencia: buscando, asignada, finalizada y cancelada. Los estados del
  trabajo y del código mantienen las reglas de los módulos correspondientes.

El botón de urgencia abre la solicitud de una visita nueva, o el seguimiento si ya
existe una activa. Las anteriores se consultan desde Servicios contratados; las
solicitudes también ofrecen acceso al seguimiento correspondiente.

## Condiciones y exclusiones

En la implementación local se procesa la cola mediante un worker periódico y ante
eventos como creación, activación de disponibilidad y cancelación del técnico.
La continuidad de la búsqueda requiere que backend, base y worker estén operativos.
No se garantizan tiempos de asignación ni llegada.

No se agregan GPS, mapas, rutas, seguimiento en vivo, notificaciones push, WebSockets,
pagos integrados ni selección con inteligencia artificial.

## Evidencia y entrega

Consultar [registro de verificación local](acta-verificacion-local.md) y
[detalle técnico de urgencias](urgencias.md). El reemplazo manual con un segundo
técnico sigue señalado como no confirmado explícitamente.
Presentar esta adenda junto al alcance V2 para que el flujo documentado corresponda
a la versión implementada. El despliegue gratuito todavía no está validado y no
modifica automáticamente los compromisos de esta adenda.
