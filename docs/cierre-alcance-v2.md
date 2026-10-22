# Revisión frente al alcance V2 — 18/10/2026

Referencia: MiTécnico - Alcance.V2.pdf, módulos 1 a 5.
Esta revisión cruza rutas, modelos, servicios y pruebas del repositorio con el
documento. No equivale a una auditoría exhaustiva ni a certificar producción.

## Funciones y evidencia disponible

| Módulo | Implementación encontrada | Evidencia / comprobación |
| --- | --- | --- |
| Usuarios y perfiles | Registro por rol, login, cuenta editable, teléfono y domicilio, foto opcional, bloqueo, perfil y documentación técnica | usuarios/serializers.py; test_registro.py, test_cuenta.py, test_bloqueo.py, test_fotos.py; tecnicos/tests.py |
| Oferta y demanda | Solicitudes y fotos, filtros por zona/especialidad, propuestas, aceptación y trabajo, cancelaciones; catálogo y solicitudes dirigidas adicionales | solicitudes/tests.py, test_trabajos.py, test_dirigidas.py, test_fotos.py, test_recorrido.py; rutas de App.jsx |
| Seguridad de visita | Código de seis dígitos, vigencia, validación por cliente, bloqueo por intentos, renovación por técnico y cancelación | tokens/models.py, services.py y tests/; documentos protegidos probados en tecnicos/tests.py |
| Reputación | Calificación bidireccional de 1 a 5 después de finalizar, una por participante, promedio, reseñas y fotos del resultado | reputacion/tests.py; solicitudes/test_recorrido.py; cuenta y perfil profesional |
| Urgencias | Disponibilidad, compatibilidad, asignación automática, trabajo y código, reemplazo y cancelación | urgencias/services.py, tests.py, management/commands/procesar_urgencias.py; UrgenciasPage y MisTrabajosPage |

Los cinco módulos tienen implementación. No se identificó un módulo completo
faltante en esta revisión; esto no implica que cualquier combinación de entradas,
concurrencia o entorno haya sido validada.

## Diferencia acordada respecto del PDF

El módulo 5 del PDF indica aceptación del técnico y confirmación del cliente.
Por decisión explícita de Pablo durante el desarrollo, la app conserva asignación
automática por especialidad, zona y disponibilidad. La visita vale $40.000, con
adicionales a acordar. La cancelación del técnico reinicia la búsqueda; la del
cliente la detiene. No se calcula cercanía GPS: dentro de candidatos compatibles
se prioriza la antigüedad de disponibilidad.

La decisión queda documentada en [la adenda de urgencias](adenda-alcance-v2-urgencias.md),
para adjuntar al alcance entregable. El PDF original no fue modificado. La adenda
no implica aprobación formal del grupo o de la cátedra.

Administración mediante Django Admin está permitida por V2.
Catálogo de técnicos, solicitud dirigida y fotos de perfil son mejoras acordadas.
No se cuentan como pendientes pagos integrados, mapas, push, aplicación nativa,
validación oficial, garantías, disputas ni panel administrativo propio.

## Verificación informada por el usuario

- Suite Django completa: 179 pruebas, OK; check sin problemas y sin migraciones faltantes.
- Frontend: lint y build completados sin errores antes de integrar ajustes móviles.
- Usuario confirmó los recorridos de urgencias, historial, disponibilidad y cuenta unificada.
- Ajustes integrados en develop, actualizado localmente a f228da2 sin cambios pendientes.
- Clave local reemplazada por una aleatoria; backend y worker recreados. Las 21 pruebas
  de usuarios pasaron después sin la advertencia de longitud de clave.
- La rotación afecta ese entorno local, no configura las computadoras de compañeros ni producción.

Estas son ejecuciones compartidas por el usuario; no una nueva ejecución realizada
durante esta revisión documental. La revisión móvil fue visual, no una certificación
de accesibilidad o compatibilidad con todos los dispositivos.

## Verificación desde una copia nueva

Pablo confirmó el arranque desde una base vacía y los recorridos normales y de
urgencia en una copia aislada de la misma computadora. Ver el
[registro completo y sus límites](acta-verificacion-local.md).
No se afirma instalación en otra máquina ni reemplazo manual con segundo técnico.

## Pendientes concretos de entrega

1. Incorporar estos documentos mediante commit/PR y presentar la adenda junto al V2.
2. Confirmar manualmente el reemplazo de urgencia con un segundo técnico compatible.
3. Si se exige reproducibilidad en otro equipo, repetir allí la guía de instalación;
   la prueba registrada se hizo en la misma computadora con configuración aislada.
4. Para despliegue público, preparar y verificar secretos, HTTPS, hosts y orígenes,
   persistencia y permisos de archivos, respaldos y procesamiento de urgencias.
   La alternativa gratuita todavía requiere adaptación y prueba. No publicar MEDIA_ROOT completo.

## Estado de cierre

Los recorridos locales informados están registrados y la variante de urgencias
cuenta con una adenda. No se afirma aprobación formal de la entrega ni preparación
completa para producción. Los pendientes anteriores conservan su estado explícito.
