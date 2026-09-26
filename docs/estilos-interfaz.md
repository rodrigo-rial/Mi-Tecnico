# Estilos compartidos de MiTécnico

Referencia: documento de interfaces del grupo, páginas 1-3 y boceto del panel técnico (11).

## Definido por el grupo
- Inter, base 16 px; React y Tailwind; enfoque mobile first.
- Principal #1a73e8; degradado hacia #1557b0; acento #1447e6.
- Texto #364152; superficie #ffffff.
- Éxito #10b981, advertencia #f59e0b, error #ef4444.

## Decisiones complementarias
- Fondo de contenido #f7f9fc y bordes #dce2ea, siguiendo el aspecto claro del boceto.
- Tarjetas de 16 px de radio; campos y botones de 8 px; controles de al menos 44 px.
- Degradado para encabezados; formularios blancos para mantener legibilidad.
- Errores y éxitos usan texto oscuro y el color de estado como borde; no dependen solo del color.
- Foco de teclado visible. No implica certificación WCAG: falta verificar la interfaz integrada.

## Uso
Los colores y la fuente se centralizan en frontend/src/index.css mediante @theme.
Usar mt-card, mt-input, mt-button y mt-file para las piezas comunes.
Inter se carga desde Google Fonts y necesita conexión; system-ui es la alternativa.
Si se decide alojarla localmente, cambiar solo esa definición compartida.

La vista temporal de App.jsx contiene ejemplos y no guarda datos. No es la integración del login.
Aplicar estas mismas reglas al montar PanelTecnico y al integrar las pantallas del equipo.
