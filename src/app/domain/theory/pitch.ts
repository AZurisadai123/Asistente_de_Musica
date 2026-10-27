import { Chord, Midi, Note } from 'tonal';

/**
 * Único punto del proyecto que usa Tonal.js. Si algún día se reemplaza la librería,
 * solo cambia esta carpeta.
 */

/** 60 → "C4". Usa bemoles salvo que se pidan sostenidos. */
export function pitchName(midi: number, preferSharps = false): string {
  return Midi.midiToNoteName(midi, { sharps: preferSharps });
}

/** "C4" → 60. Devuelve null si el texto no es una nota válida. */
export function parsePitch(name: string): number | null {
  return Note.midi(name) ?? null;
}

/** Clase de altura de 0 a 11 (0 = do). */
export function pitchClassOf(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export interface ParsedChord {
  readonly symbol: string;
  readonly root: string;
  /** Clases de altura de 0 a 11 de las notas del acorde. */
  readonly pitchClasses: readonly number[];
}

/** "Am7" → raíz A y clases de altura [9, 0, 4, 7]. null si el símbolo no se reconoce. */
export function parseChord(symbol: string): ParsedChord | null {
  const chord = Chord.get(symbol.trim());
  if (chord.empty || !chord.tonic) {
    return null;
  }
  const pitchClasses = chord.notes
    .map((note) => Note.chroma(note))
    .filter((chroma): chroma is number => typeof chroma === 'number');
  return { symbol: chord.symbol, root: chord.tonic, pitchClasses };
}
