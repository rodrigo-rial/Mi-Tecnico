# Técnicos: contrato del backend

Estado: módulo de perfil y documentación integrado en develop; catálogo de zonas ampliado en feature/zonas-cobertura.

## Autenticación y permisos

Las peticiones autenticadas envían el JWT de acceso:

```text
Authorization: Bearer <access>
```

Los catálogos requieren autenticación. Las operaciones de perfil y documentación
requieren un usuario activo con rol `TECNICO`. El backend siempre obtiene el
usuario desde el JWT; el cliente no elige el propietario del perfil.

Respuestas comunes:

- `400`: datos inválidos o perfil duplicado.
- `401`: falta autenticación o el token no es válido.
- `403`: el rol no tiene permiso.
- `404`: el técnico todavía no tiene perfil.

## Catálogos

### GET /api/tecnicos/especialidades/

Devuelve las especialidades activas como objetos con `id` y `nombre`.

### GET /api/tecnicos/zonas/

Devuelve las zonas activas como objetos con `id` y `nombre`.

Las especialidades iniciales son Electricidad, Gas, Plomería y Refrigeración.
La migración `0004_cargar_zonas_iniciales` carga 33 zonas de servicio.
Son opciones por localidad o barrio, no límites geográficos ni cálculo de distancia.
El cliente y el técnico deben usar los mismos identificadores del catálogo.

- La Plata — casco urbano
- Tolosa
- Ringuelet
- Gonnet
- City Bell
- Villa Elisa
- Los Hornos
- Berisso
- Ensenada
- Berazategui
- Ranelagh
- Hudson
- Quilmes
- Bernal
- Don Bosco
- Ezpeleta
- Florencio Varela
- Wilde
- Avellaneda
- Lanús
- Banfield
- Lomas de Zamora
- Temperley
- La Boca
- Barracas
- Constitución
- San Telmo
- Monserrat
- Balvanera
- Almagro
- Caballito
- Flores
- Palermo

La carga conserva las zonas existentes y no reactiva las deshabilitadas.
Al revertir la migración se conservan los datos para no eliminar asociaciones.
Cada integrante debe ejecutar `docker compose exec backend python manage.py migrate`.

La pantalla agrupa las zonas en desplegables: La Plata y alrededores, Zona sur y CABA. Las opciones anteriores o nuevas que no pertenezcan a esos grupos se muestran en Otras zonas. Esta agrupación es visual: la API sigue recibiendo una lista de identificadores de zonas y permite elegir varias de distintos sectores.

## Perfil propio

### POST /api/tecnicos/perfil/

Crea el perfil del técnico autenticado. Solo puede existir uno por usuario.

Cuerpo JSON:

```json
{
  "descripcion": "Experiencia y servicios ofrecidos",
  "especialidades": [1],
  "zonas": [1]
}
```

Especialidades y zonas reciben identificadores activos y exigen al menos un
elemento. Devuelve `201` al crear y `400` si el usuario ya posee un perfil.

### GET /api/tecnicos/perfil/

Devuelve el perfil propio. Incluye `usuario`, `descripcion`, identificadores de
especialidades y zonas, `estado_validacion`, `creado_en` y `actualizado_en`.

### PATCH /api/tecnicos/perfil/

Modifica parcialmente descripción, especialidades o zonas. `usuario` y
`estado_validacion` son de solo lectura: enviarlos no cambia sus valores.

## Documentación propia

### GET /api/tecnicos/documentacion/

Devuelve los números, el estado y dos indicadores booleanos. No expone rutas,
nombres ni enlaces de los archivos.

```json
{
  "dni_numero": "12345678",
  "matricula_numero": "MAT-123",
  "tiene_documento_dni": true,
  "tiene_documento_matricula": true,
  "estado_validacion": "PENDIENTE"
}
```

### PATCH /api/tecnicos/documentacion/

Recibe `multipart/form-data` para cargar cualquiera de estos campos:

- `dni_numero`
- `matricula_numero`
- `documento_dni`
- `documento_matricula`

Los documentos admiten PDF, JPG, JPEG y PNG, con un máximo de 5 MB. Reemplazar
cualquier dato documental devuelve el perfil a `PENDIENTE`. Cuando se reemplaza
un archivo, el anterior se elimina del almacenamiento.

## Validación administrativa

El perfil comienza en `PENDIENTE`. Personal con acceso y permiso de cambio en
Django Admin puede asignar `APROBADO` o `RECHAZADO`. Aprobar exige número y
archivo de DNI, y número y archivo de matrícula.

Los datos del perfil son de solo lectura en Admin. Los archivos se descargan
mediante vistas protegidas del propio Admin y no se publican bajo `/media/`.

## Integración con propuestas y urgencias

Las vistas que requieran un técnico aprobado deben reutilizar:

```python
from tecnicos.permissions import EsTecnicoAprobado

permission_classes = [EsTecnicoAprobado]
```

El permiso comprueba autenticación, cuenta activa, rol `TECNICO`, perfil
existente y estado `APROBADO`.

## Verificación local

```powershell
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check --dry-run
docker compose exec backend python manage.py test tecnicos
```

Las pruebas cubren acceso por rol, perfil propio, catálogos activos,
documentación, límites de archivo, aprobación, descargas administrativas y el
permiso reutilizable para técnicos aprobados.
