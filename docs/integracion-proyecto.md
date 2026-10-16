# Integración del proyecto — 16/10/2026

Rama de trabajo: `feature/integracion-proyecto`.

## Fuentes reunidas
- `origin/develop` y los avances locales de interfaz, código de visita y urgencias.
- `origin/feature/reputacion-backend-v2`.
- `origin/feature/reputacion-frontend-v2`.

## Resoluciones
- Se conservan ambas aplicaciones: urgencias y reputación.
- El detalle del trabajo mantiene la confirmación del código por el cliente e incorpora calificaciones y fotos.
- Se utiliza el hook de usuario y el servicio de trabajos existentes.
- La carga del panel de reputación descarta respuestas tras abandonar la pantalla.
- En desarrollo se sirven únicamente las fotos de `/media/trabajos/`; los documentos técnicos mantienen las descargas administrativas protegidas. El despliegue debe respetar esa separación, sin publicar todo MEDIA_ROOT.
- Se incorpora una prueba de acceso a fotos y rechazo de acceso directo o por traversal a documentos.

## Ejecución local
Reconstruir backend y urgencias_worker para instalar Pillow; ejecutar `python manage.py migrate` dentro del backend. La migración de reputación agrega sus tablas sin borrar los datos existentes.

## Pendientes posteriores
- Verificación visual con cuentas de cliente y técnico de un trabajo finalizado.
- Comprobar visualmente el promedio de reputación en las cuentas y el perfil profesional.
- Edición de datos básicos de cuenta y fotografías opcionales de solicitudes.
- Pruebas de aceptación del recorrido completo y preparación de entrega.

Esta rama todavía no se publica ni se integra a develop.

## Reputación en perfiles
Se conectó el resumen a Mi cuenta (cliente/técnico) y al perfil profesional. Incluye promedio, cantidad, estado sin calificaciones, errores y reintento. Descarta respuestas de pantallas abandonadas.

La subida de fotos usa el cliente HTTP compartido, que admite FormData sin fijar Content-Type y renueva el acceso ante un 401. Pruebas: `docker compose exec frontend node --test tests/http.test.mjs` (JSON, reenvío del archivo tras renovar y sesión no renovable).
