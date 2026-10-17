# Cierre contra Alcance V2

Referencia principal: MiTecnico - Alcance.V2.pdf. Los documentos anteriores no agregan requisitos eliminados del V2.

## Decisiones confirmadas

- Urgencias: asignacion automatica por especialidad, zona y disponibilidad, visita de $40.000 y busqueda de reemplazo al cancelar. El usuario confirmo mantener esta variante; actualizar el apartado de urgencias del documento para reflejarla.
- Administracion mediante Django Admin, permitida por V2.
- Sin pasarela de pagos, GPS, mapas en vivo, rutas ni notificaciones push.
- Garantias, disputas y panel administrativo propio no se cuentan como pendientes de este alcance.
- Perfil profesional desde propuestas agregado por pedido del usuario, como mejora adicional.

## Verificaciones recientes

- Recorrido API completo desde solicitud con foto hasta finalizacion, calificaciones y foto de resultado.
- Bloqueo por is_active=False: rechaza login y acceso con JWT previo; refresh no recupera acceso protegido. Tres pruebas con autenticacion real y base temporal.
- Perfil profesional: solo tecnicos activos y aprobados; respuesta limitada a datos profesionales, resumen, resenas y fotos.
- Navegacion de cliente: filtros de finalizadas, servicios contratados, seguimiento y reputacion.

## Pendientes de cierre

- Revision visual en telefono real o emulacion de viewport movil.
- Revisar el resto de reglas del V2 antes de afirmar cumplimiento completo.
- Integrar cambios locales mediante PR y repetir verificaciones sobre el resultado integrado.
- Configuracion de produccion y prueba de despliegue. Las pruebas JWT detectaron una clave de firma local corta: configurar una clave aleatoria robusta para produccion, sin incluirla en Git. No se modificaron secretos ni sesiones actuales.
- Documentacion de ejecucion, migraciones, archivos y demostracion final.
