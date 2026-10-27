# Asistente de música

Proyecto de portafolio en dos partes que comparten el mismo modelo de canción:

- **A, asistente de composición:** piano roll, línea de acordes y un motor de reglas que sugiere mejoras explicadas.
- **B, transcriptor de audio:** convierte audio de un instrumento en notas (Basic Pitch en un Web Worker) y reutiliza el editor de A.

Todo corre en el navegador, sin servidor. Angular 21, TypeScript estricto, Vitest.

## Reglas obligatorias

1. **Máximo 300 líneas por archivo**, contando todas (incluidos comentarios y líneas en blanco).
   Divide el archivo antes de llegar al límite. Lo revisan `npm run lint` y `npm run check:lines`.
2. **Arquitectura hexagonal.** Las dependencias solo apuntan hacia el dominio:

| Capa        | Carpeta                    | Puede importar                                         |
| ----------- | -------------------------- | ------------------------------------------------------ |
| Dominio     | `src/app/domain`           | solo `domain` (Tonal.js únicamente en `domain/theory`) |
| Aplicación  | `src/app/application`      | `domain`, `application`                                |
| Adaptadores | `src/app/adapters`         | `domain`, `application`, `adapters`                    |
| Interfaz    | `src/app/ui`               | `domain`, `application`, `ui`                          |
| Composición | `src/app/*.ts`, `src/*.ts` | todo; aquí se conecta cada puerto con su adaptador     |

- `domain` y `application` son TypeScript puro: nada de Angular, RxJS, Tone.js, OSMD ni APIs del navegador.
- Cada librería externa (Tone.js, OSMD, @tonejs/midi, Basic Pitch, IndexedDB) va en un adaptador detrás de un puerto de `application/ports/out`.
- La interfaz inyecta puertos con los tokens de `ui/ports.tokens.ts`; nunca importa adaptadores.
- ESLint (`eslint-plugin-boundaries` y `no-restricted-imports`) hace cumplir estas reglas.

## Decisiones del modelo

- Tiempo en ticks enteros, 480 por negra (`domain/model/time.ts`).
- Notas y acordes en listas planas con inicio absoluto; los compases se derivan (`domain/services/measures.ts`).
- Las secciones se alinean a compases completos.
- `Song.schemaVersion` permite migrar canciones guardadas cuando cambie el modelo.
- Los ids llegan desde fuera del dominio (puerto `IdGenerator`).
- Reproducción: la interfaz usa el puerto `Playback`; `PlaybackUseCase` calcula los eventos con
  `domain/services/playback-events.ts` y los entrega al puerto `AudioEngine`. `ToneAudioEngine`
  solo los programa, y carga Tone.js con `import()` dinámico tras el primer clic.

## Comandos

```bash
npm start              # servidor de desarrollo
npm test               # pruebas (Vitest)
npm run lint           # ESLint: capas y 300 líneas en .ts
npm run check:lines    # 300 líneas en todos los archivos fuente
npm run format         # Prettier
npm run build          # build de producción
```

Nota: con el npm 10.8 de Node 20 la instalación falla (`Cannot read properties of null (reading 'edgesOut')`).
Usa `npx npm@11 install` o actualiza Node.
