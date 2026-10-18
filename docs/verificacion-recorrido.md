# Verificacion del recorrido integrado

La prueba `solicitudes.test_recorrido` usa las API reales de Django con usuarios, base de datos y archivos temporales. No modifica las solicitudes del entorno de desarrollo. La autenticacion se fija por rol en la prueba; esto no sustituye una prueba del login ni del navegador.

Recorrido comprobado:

1. Cliente publica una solicitud con foto.
2. Tecnico compatible consulta la foto y envia una propuesta.
3. Cliente acepta; se crea un trabajo pendiente.
4. Se rechaza iniciar sin codigo y calificar antes de finalizar.
5. Otro cliente no puede consultar el trabajo ni la foto privada.
6. Tecnico consulta el codigo; cliente lo valida para iniciar.
7. Tecnico finaliza; la solicitud tambien queda finalizada.
8. Ambos participantes califican; una segunda calificacion se rechaza.
9. Tecnico sube una foto del resultado; cliente consulta la galeria.
10. El promedio del tecnico refleja la calificacion recibida y no se permite cancelar el trabajo ya finalizado.

Comando de verificacion ampliada:

```text
python manage.py test solicitudes.test_trabajos tokens.tests solicitudes.test_recorrido --noinput
```

Antes de publicar, completar una pasada en navegador con ambos roles: login, publicar, enviar propuesta, aceptar, validar codigo, finalizar, fotos y reputacion. Revisar tambien la vista movil. Las pruebas de API no verifican botones, navegacion ni distribucion visual.

## Registro manual posterior

El recorrido normal fue confirmado por Pablo en la instalación aislada del
18/10/2026. Ver [acta de verificación local](acta-verificacion-local.md) para
resultados, incidencias y límites. La comprobación en la futura URL pública
continúa pendiente.
