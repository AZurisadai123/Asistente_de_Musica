import { Note } from 'tonal';
import { parseChord } from './pitch';

/** Do3: la fundamental del acompañamiento cae entre Do3 y Si3. */
const ROOT_OCTAVE_BASE = 48;

/**
 * Voz cerrada simple para reproducir un acorde: fundamental en la octava 3 y el resto
 * de las notas apiladas hacia arriba. Devuelve null si el símbolo no se reconoce.
 */
export function chordVoicing(symbol: string): number[] | null {
  const chord = parseChord(symbol);
  if (!chord) {
    return null;
  }
  const rootChroma = Note.chroma(chord.root);
  if (typeof rootChroma !== 'number') {
    return null;
  }
  const root = ROOT_OCTAVE_BASE + rootChroma;
  return chord.pitchClasses
    .map((pitchClass) => root + ((pitchClass - rootChroma + 12) % 12))
    .sort((a, b) => a - b);
}
