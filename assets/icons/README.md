# Íconos de contacto

Esta carpeta guarda los íconos que se dibujan junto a cada fila del bloque de contacto
(celular, teléfono, dirección, web, email, o cualquier fila personalizada que crees).

## Cómo usarlos

1. Coloca aquí tus archivos PNG (fondo transparente, cuadrados, ideal 64×64 o 128×128 px —
   se reescalan solos al "Tamaño ícono" que definas en el diseñador, así que no hace falta
   que coincidan exactamente).
2. En `disenador.html`, dentro de **Bloque de contacto → [tu fila] → ruta del ícono**, escribe
   la ruta relativa, por ejemplo:
   ```
   assets/icons/celular.png
   assets/icons/telefono.png
   assets/icons/direccion.png
   assets/icons/web.png
   assets/icons/email.png
   ```
3. O usa el botón **"Subir"** junto al campo para previsualizarlo al instante mientras diseñas
   (queda embebido temporalmente hasta que subas el archivo real a esta carpeta y apuntes la
   ruta — mismo patrón que ya usas para los fondos).

## Notas

- Una fila **sin ícono** simplemente no reserva espacio para uno — el texto empieza pegado a la
  posición X de la fila. No es obligatorio poner ícono en todas las filas.
- El tamaño del ícono y el espacio entre ícono y texto son compartidos por **todas** las filas
  del bloque de contacto de esa marca (controles "Tamaño ícono" / "Espacio ícono↔texto"), para
  que las filas queden alineadas entre sí — no hay un tamaño distinto por fila.
- Si vas a tener celular **y** teléfono fijo a la vez, usa un ícono distinto para cada uno
  (ej. un teléfono móvil vs. un teléfono de disco/oficina) para que se distingan de un vistazo.
