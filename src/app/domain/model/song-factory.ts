import { SONG_SCHEMA_VERSION, Song } from './song';
import { COMMON_TIME } from './time';

export const DEFAULT_TEMPO = 100;

/** El id llega desde fuera: generar ids depende del entorno y no es asunto del dominio. */
export function createEmptySong(id: string, title = 'Sin título'): Song {
  return {
    schemaVersion: SONG_SCHEMA_VERSION,
    id,
    title,
    tempo: DEFAULT_TEMPO,
    timeSignature: COMMON_TIME,
    key: null,
    style: 'pop-rock',
    sections: [],
    notes: [],
    chords: [],
  };
}
