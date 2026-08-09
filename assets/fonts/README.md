# Fuentes de marca

Poppins se carga desde Google Fonts (ver `<link>` en `firmas.html` y `disenador.html`) — no necesita nada aquí.

## Gilmer (NextNet)

Según el skill de marca `nextnet-brand`, NextNet usa **Gilmer** como tipografía única — nunca Poppins ni
Bauhaus Bugler, precisamente para no parecerse a Fiberlux. Gilmer no está en Google Fonts (es de pago /
Adobe Fonts), así que no se puede enlazar por CDN como Poppins.

**Para activarla de verdad:**

1. Consigue las licencias/archivos `.woff2` de Gilmer (Regular 400, Medium 500, Bold 700).
2. Colócalos en esta carpeta con estos nombres exactos:
   - `Gilmer-Regular.woff2`
   - `Gilmer-Medium.woff2`
   - `Gilmer-Bold.woff2`
3. Recarga `disenador.html` — el `@font-face` ya está declarado en el `<head>` de ambas apps, así que
   la fuente se activa sola sin tocar código. El campo "Tipografía de esta marca" del diseñador te avisa
   con un ⚠ si el archivo no está presente.

**Mientras no subas los archivos:** el generador cae automáticamente a `'Segoe UI', Arial, sans-serif`
para NextNet (nunca a Poppins) — así la firma nunca se confunde visualmente con Fiberlux, aunque no sea
pixel-perfecta a Gilmer todavía.

## Agregar una tipografía nueva para otra submarca

En `disenador.html`, con la empresa seleccionada, escribe el stack de fuente en el campo
**"Tipografía de esta marca"**, por ejemplo:

```
'MiFuenteNueva', 'Poppins', Arial, sans-serif
```

Si la fuente no es de Google Fonts, agrégala aquí como `.woff2` y su `@font-face` en el `<style>` de
ambos HTML (mismo patrón que Gilmer arriba).
