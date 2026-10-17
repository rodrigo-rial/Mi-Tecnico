# Fotos opcionales de solicitudes

El cliente puede adjuntar hasta cinco imágenes JPG, PNG o WEBP de hasta 5 MB cada una al publicar una solicitud. Sin imágenes sigue funcionando el contrato JSON anterior; con imágenes se envía multipart con el campo repetido `imagenes`.

La validación se hace antes de crear la solicitud. La creación de registros es transaccional y se eliminan los archivos ya guardados si falla la operación. `fotos` devuelve identificadores, sin rutas de almacenamiento.

`GET /api/solicitudes/{solicitud_id}/fotos/{foto_id}/` exige autenticación y autoriza al cliente dueño, a técnicos compatibles con la solicitud publicada o al técnico asignado a su trabajo. No se publica el directorio de fotos de solicitudes a través de MEDIA_URL. El frontend obtiene blobs autenticados y libera sus URL temporales al cerrar la galería.

Las fotos se consultan con “Ver fotos” en las tarjetas del cliente y en el listado compatible del técnico. Este módulo corresponde a solicitudes normales (incluido su indicador urgente), no agrega archivos al formulario separado de urgencias automáticas.

Ejecutar las migraciones al actualizar. Pruebas específicas: `python manage.py test solicitudes.test_fotos`. Las fotos y los documentos existentes no se modifican.
