# Registro de verificación local — 18/10/2026

## Entorno y origen de la evidencia

Ejecutó las comprobaciones Pablo Quiroz y compartió las salidas de consola y las
confirmaciones del recorrido manual. Este registro no representa una ejecución
automática nueva ni una prueba de producción.

Se clonó develop después de la integración 36194c1 en una carpeta separada,
Mi-Tecnico-prueba-instalacion, en la misma computadora Windows con Docker Desktop.
Se usó el proyecto Compose mitecnico-prueba, con base y volumen propios, frontend
en localhost:5174 y API/admin en localhost:8001. Se añadieron ajustes locales de
puertos, nombres, origen permitido y URL de API para coexistir con la app habitual.
Es una prueba desde una copia y base nuevas, no una instalación en otra máquina
ni una ejecución sin ajustes del Compose original. Docker reutilizó algunas capas.

## Resultados

| Comprobación | Resultado y evidencia |
| --- | --- |
| Construcción | Imágenes de backend, frontend y worker construidas; salida de Docker compartida |
| Migraciones desde base vacía | Todas las migraciones finalizaron en OK, incluidas zonas, especialidades y fotos de perfil |
| Arranque | Cuatro servicios iniciados; PostgreSQL saludable; check sin problemas |
| Registro y aprobación | Usuario confirmó cliente, técnico, catálogos iniciales, carga de documentación y aprobación administrativa |
| Recorrido normal | Usuario confirmó solicitud con foto, propuesta, aceptación, código de visita, inicio y finalización, foto del resultado y calificaciones de ambos roles |
| Urgencia sin disponibilidad | Usuario confirmó el recorrido indicado: búsqueda inicial y asignación al activar al técnico compatible |
| Disponibilidad y cancelación | Confirmó el recorrido indicado: disponibilidad desactivada tras asignación, regreso a búsqueda al cancelar el técnico y cancelación final por cliente |
| Reemplazo con segundo técnico | No confirmado explícitamente; mantener pendiente la comprobación manual de asignación a otro técnico |
| Cierre de prueba | Los cuatro servicios se detuvieron con stop, sin borrar los datos; regreso al repositorio habitual con develop sincronizado y limpio |

Las confirmaciones manuales fueron globales para cada secuencia propuesta; no se
adjuntaron capturas individuales de cada paso. No se registran contraseñas, claves
ni documentos personales en este archivo.

## Incidencia durante la instalación

El comando de migración se ejecutó inicialmente incompleto: run --rm backend
arrancó el servidor. Luego se intentó ejecutar manage.py desde la raíz de Windows.
Se resolvió ejecutando la línea completa dentro del contenedor. Las migraciones
posteriores terminaron en OK; no se identificó una falla de migraciones del proyecto.

## Pruebas previas en el entorno habitual

- Suite Django: 179 pruebas, OK; check sin problemas y sin migraciones por generar.
- Frontend: lint y build completados correctamente antes de integrar ajustes móviles.
- Tras rotar la clave local: 21 pruebas de usuarios, OK, sin advertencia de clave corta.

Estas ejecuciones preceden a la instalación aislada; no se repitió la suite completa
en la copia nueva. La evidencia valida lo probado, no todos los casos posibles.

## Límites y pendientes

- Confirmar manualmente el reemplazo con un segundo técnico compatible.
- Instalación en otra máquina y restauración de respaldos no verificadas.
- Despliegue público, HTTPS y comportamiento bajo límites del alojamiento gratuito
  no verificados. Cualquier adaptación del procesamiento de urgencias exige volver
  a comprobar el flujo y documentar sus condiciones.

Conclusión: arranque desde base nueva y recorridos indicados confirmados localmente.
No constituye certificación de producción ni aprobación formal de la cátedra.
