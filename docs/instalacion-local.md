# Instalación y verificación local de MiTécnico

Plataforma web responsive para vincular clientes con técnicos verificados.
React presenta las pantallas y consulta la API de Django REST Framework. Django
valida permisos y reglas, guarda datos en PostgreSQL y administra los archivos.
Docker Compose ejecuta frontend, backend, base de datos y proceso de urgencias.

## Instalación local desde cero (Windows / PowerShell)

Requisitos: Git y Docker Desktop iniciado con contenedores Linux.
Estos pasos son para una copia nueva; no reemplazar un `.env` existente.

```powershell
git clone https://github.com/rodrigo-rial/Mi-Tecnico.git
cd Mi-Tecnico
git switch develop
Copy-Item .env.example .env
```

Editar `.env` y configurar `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD`
para esta instalación. Mantener `DB_HOST=db`, `DB_PORT=5432` y, para desarrollo,
`DJANGO_DEBUG=True`. Puertos del ejemplo: PostgreSQL 5432, Django 8000 y frontend
5173. No subir `.env` ni compartir su contenido.

Generar una clave local aleatoria sin mostrarla:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/configurar-clave-local.ps1
docker compose build
docker compose up -d db
docker compose run --rm --no-deps backend python manage.py migrate
docker compose up -d
docker compose exec backend python manage.py createsuperuser
docker compose ps
```

Esperar a que la base esté saludable antes de migrar; si todavía no está lista,
consultar `docker compose ps` y repetir la migración cuando lo esté.
Las migraciones cargan especialidades y zonas iniciales. Las cuentas y trabajos
de demostración se crean desde la aplicación; no se incluyen contraseñas de prueba.

- Aplicación: http://localhost:5173/
- Administración: http://localhost:8000/admin/
- Registrar un cliente y un técnico desde `/registro`.
- Completar perfil, especialidades, zonas y documentación del técnico en Mi cuenta.
- Revisar y aprobar el perfil desde Django Admin con el superusuario.
- Para la demostración, utilizar archivos ficticios.

Los enlaces suponen los puertos del ejemplo. El frontend usa por defecto
`http://localhost:8000/api`; cambiar el puerto del backend requiere ajustar
`VITE_API_URL` en el entorno del frontend. Cambiar el origen del frontend requiere
ajustar también los orígenes permitidos del backend.

## Continuar trabajando

Con los cambios propios guardados y la rama correcta seleccionada:

```powershell
git pull --ff-only
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

Si cambió package-lock.json y faltan dependencias del frontend, ejecutar
`docker compose exec frontend npm ci` y `docker compose restart frontend`.
El volumen de node_modules puede conservar dependencias de una instalación previa.

Para detener sin borrar datos: `docker compose stop`.
Para volver a iniciar: `docker compose up -d`.
No usar `docker compose down -v` para un cierre normal: elimina el volumen de la base.

## Verificación

```powershell
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check --dry-run
docker compose exec backend python manage.py test --noinput
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
docker compose exec frontend node --test tests/http.test.mjs
```

Dejar terminar las pruebas. `makemigrations --check --dry-run` comprueba que los
modelos tengan sus migraciones; no reemplaza `migrate`.
Las pruebas Django usan una base temporal, no las solicitudes guardadas en la app.

Ver [recorrido de aceptación](verificacion-recorrido.md) y
[estado frente al alcance V2](cierre-alcance-v2.md).

## Urgencias y códigos

La urgencia automática busca un técnico aprobado, activo, disponible, compatible
por especialidad y zona, y sin trabajo activo. La visita cuesta $40.000; adicionales
se acuerdan entre las partes y el pago ocurre fuera de la plataforma.
Si cancela el técnico, busca otro; si cancela el cliente, detiene la búsqueda.
El proceso `urgencias_worker` debe permanecer iniciado para procesar la cola.

El código de seis dígitos de una visita es distinto del JWT de sesión: el técnico
lo muestra y el cliente lo valida para iniciar el trabajo.

## Datos y secretos

PostgreSQL persiste en el volumen `postgres_data`. Los archivos se guardan en
`backend/media`, montado desde el equipo. Respaldar ambos para preservar datos y fotos.
No publicar todo `media`: documentos técnicos y otros archivos privados tienen
controles de acceso. Las fotos de trabajos tienen un tratamiento separado.

El script de clave solo se ejecuta al configurar el entorno o rotar una clave.
Si se cambia con la app instalada, recrear los servicios para leer el nuevo `.env`:

```powershell
docker compose up -d --force-recreate backend urgencias_worker
```

Esto invalida sesiones firmadas con la clave anterior: volver a iniciar sesión.
No borra cuentas, trabajos ni archivos. La clave es propia de cada entorno.

## Producción

El Compose actual usa servidores de desarrollo de Django y Vite.
No es una configuración de producción. Antes de publicar hay que definir hosting,
HTTPS, servidor de aplicación, frontend compilado, hosts y orígenes permitidos,
secretos del entorno, DEBUG=False, servicio de archivos con permisos, respaldos y
supervisión del worker. Ejecutar las comprobaciones y la demostración en ese entorno.
No se ha verificado un despliegue público ni una restauración de respaldos.
