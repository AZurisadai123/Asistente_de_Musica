import { Note, Song } from '../../domain/model/song';
import { createEmptySong } from '../../domain/model/song-factory';
import { TICKS_PER_QUARTER } from '../../domain/model/time';
import { parseMeasureChords } from '../../domain/services/chord-line';

const Q = TICKS_PER_QUARTER;

/** [altura MIDI, inicio en negras, duración en negras]. Melodía de 4 compases en do mayor. */
const MELODY: readonly (readonly [number, number, number])[] = [
  [64, 0, 1],
  [67, 1, 1],
  [72, 2, 1.5],
  [71, 3.5, 0.5],
  [69, 4, 1],
  [72, 5, 1],
  [69, 6, 2],
  [65, 8, 1],
  [69, 9, 1],
  [72, 10, 1],
  [74, 11, 1],
  [71, 12, 1],
  [67, 13, 1],
  [62, 14, 1],
  [60, 15, 1],
];

const CHORD_LINE = ['C', 'Am', 'F', 'G'];

/** Canción de ejemplo para probar la reproducción. */
export function createDemoSong(nextId: () => string): Song {
  const base = createEmptySong(nextId(), 'Ejemplo en do mayor');
  const notes: Note[] = MELODY.map(([pitch, start, duration]) => ({
    id: nextId(),
    pitch,
    start: start * Q,
    duration: duration * Q,
    velocity: 96,
  }));
  const chords = CHORD_LINE.flatMap(
    (text, measure) => parseMeasureChords(text, measure, base.timeSignature, nextId).chords,
  );
  return {
    ...base,
    key: { tonic: 'C', mode: 'major' },
    sections: [{ id: nextId(), type: 'verse', name: 'Estrofa', startMeasure: 0, measureCount: 4 }],
    notes,
    chords,
  };
}
