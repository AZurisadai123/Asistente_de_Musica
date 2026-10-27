# Asistente de música

Asistente de composición con sugerencias explicadas (proyecto A) y transcriptor de audio a partitura (proyecto B). Todo corre en el navegador: el audio nunca sale del dispositivo.

> Estado: fase A1, modelo de canción, teoría musical y reproducción con Tone.js.

## Arquitectura

Arquitectura hexagonal (puertos y adaptadores):

- `src/app/domain`: modelo de canción, teoría musical y reglas. TypeScript puro.
- `src/app/application`: casos de uso y puertos (interfaces).
- `src/app/adapters`: implementaciones con librerías externas (Tone.js, OSMD, MIDI, Basic Pitch, IndexedDB).
- `src/app/ui`: componentes de Angular.

Las reglas de capas y el límite de 300 líneas por archivo se revisan con ESLint en cada push.

## Cómo correrlo

```bash
npm install
npm start
```

Pruebas: `npm test`. Lint: `npm run lint`.
