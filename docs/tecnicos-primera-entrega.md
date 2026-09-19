# Primera entrega: Técnicos

Estado: estructura preparada; propuesta pendiente de coordinación. La app todavía
no está registrada en INSTALLED_APPS y no contiene modelos ni migraciones.
Rama de trabajo: feature/tecnicos-base.

## Objetivo

Un usuario TECNICO completa su perfil, selecciona especialidades y zonas,
carga DNI y matrícula y queda PENDIENTE. Personal autorizado revisa los
archivos en Django Admin y lo aprueba o rechaza.

## Propuesta de modelos (no implementados aún)

- PerfilTecnico: usuario (relación uno a uno a settings.AUTH_USER_MODEL),
  descripcion profesional opcional, especialidades y zonas de cobertura,
  estado_validacion con PENDIENTE como valor inicial, APROBADO y RECHAZADO.
- Especialidad: nombre único y catálogo inicial con Electricidad, Gas,
  Plomería y Refrigeración, según la guía.
- Zona: nombre único y catálogo predefinido. Falta acordar las zonas reales.
- Documentación: definir si DNI y matrícula pertenecen al perfil o a una
  entidad separada, sus formatos y tamaño máximo. Acceso privado del titular
  y personal autorizado; no incluir documentos en respuestas públicas.

La relación de especialidades propuesta es múltiple. Confirmar con el equipo
si el alcance espera una o varias por técnico antes de crear la migración.

## Reglas de la primera entrega funcional

- Solo un usuario con rol TECNICO puede tener un perfil técnico.
- Un usuario no puede tener dos perfiles.
- El titular solo puede modificar su propio perfil.
- El titular no puede asignarse APROBADO ni cambiar el usuario del perfil.
- Aprobar exige DNI y matrícula y autorización del personal revisor.
- Las especialidades y zonas se seleccionan por identificador del catálogo.
- Coordinar qué ocurre al reemplazar documentos después de una aprobación.

## Contrato API propuesto para acordar antes de las pantallas

- GET /api/especialidades/: catálogo; acceso autenticado.
- GET /api/zonas/: catálogo; acceso autenticado.
- POST /api/tecnicos/perfil/: crear perfil propio; rol TECNICO.
- GET /api/tecnicos/perfil/: consultar perfil propio; rol TECNICO.
- PATCH /api/tecnicos/perfil/: editar datos propios; rol TECNICO.

POST y PATCH recibirían descripcion, especialidades (lista de IDs) y zonas
(lista de IDs). usuario se obtiene de la sesión; estado_validacion es de solo
lectura. Respuestas esperadas: 201 al crear, 200 al leer/editar, 400 para datos
inválidos o perfil duplicado, 401 sin autenticación, 403 para rol no permitido,
404 al consultar un perfil inexistente. La carga documental se define aparte.

## Coordinación

Integrante 1: integrar Usuario, confirmar AUTH_USER_MODEL=usuarios.Usuario y
acordar permisos de revisión. El rol ADMINISTRADOR y el acceso a Django Admin
no se deben considerar equivalentes automáticamente.

Integrante 3: reutilizar Especialidad y Zona y verificar aprobación al proponer.
Integrante 4: reutilizar catálogos y verificar aprobación al aceptar urgencias;
acordar dónde almacena disponibilidad para evitar duplicar ese campo.
No modificar Usuario ni Trabajo como parte de esta entrega.

## Orden de implementación

1. Confirmar e integrar la base de Usuario con el equipo.
2. Revisar el historial de migraciones de la base local antes de cambiar de
   usuario predeterminado a personalizado. No borrar datos o volúmenes.
3. Acordar campos y catálogos; implementar modelos y registrar la app.
4. Generar y revisar migraciones, y probar unicidad y reglas del perfil.
5. Agregar API propia y pruebas de permisos.
6. Agregar documentación y aprobación manual con pruebas de estados.
7. Construir pantallas React sobre los endpoints verificados.

## Comprobaciones pendientes

GitHub y Docker no se pudieron consultar desde esta sesión por restricciones
locales de acceso. Las ramas observadas son referencias locales almacenadas.
Existe una eliminación previa de .env.example; no forma parte de esta entrega.
