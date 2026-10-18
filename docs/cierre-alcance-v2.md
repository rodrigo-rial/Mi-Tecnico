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
Por decisión explícita del equipo transmitida por Pablo, la app conserva asignación
automática por especialidad, zona y disponibilidad. La visita vale $40.000, con
adicionales a acordar. La cancelación del técnico reinicia la búsqueda; la del
cliente la detiene. No se calcula cercanía GPS: dentro de candidatos compatibles
se prioriza la antigüedad de disponibilidad.

Actualizar o anexar esta decisión al documento que se presente. El PDF original
no fue modificado. No afirmar coincidencia literal con ese flujo del V2.

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

## Pendientes concretos de entrega

1. Incorporar la decisión de urgencias al alcance entregable y acordarla con el grupo.
2. Probar la guía `docs/instalacion-local.md` desde una copia nueva en otra máquina, con base y archivos propios;
   confirmar migraciones, zonas, especialidades, registro, aprobación y worker.
3. Ejecutar una demostración final con ambos roles: solicitud normal, propuesta,
   código, finalización, calificaciones y foto; urgencia sin candidatos, asignación,
   reemplazo y cancelación. Registrar resultado y cualquier incidencia.
4. Aplicar y revisar este parche documental, hacer commit/PR y conservar la evidencia.
5. Si la entrega exige despliegue: preparar el entorno de producción y verificarlo.
   Compose actual es local. Falta definir hosting, HTTPS, secretos, archivos, respaldos
   y supervisión. No publicar todo MEDIA_ROOT.

## Condiciones de cierre

La entrega local puede considerarse lista cuando la instalación desde cero y la
demostración final estén registradas, los cambios documentales integrados y el alcance
refleje la decisión de urgencias. Un despliegue público requiere validación aparte.
