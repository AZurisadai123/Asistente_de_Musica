import { Chord, Song } from '../model/song';
import { measureIndexAt, measureStart, ticksPerMeasure, TimeSignature } from '../model/time';
import { parseChord } from '../theory/pitch';

export interface ChordLineResult {
  readonly chords: Chord[];
  /** Símbolos que no se reconocieron; esos acordes no se crean. */
  readonly invalidSymbols: string[];
}

const SEPARATORS = /[\s,|]+/;

/**
 * Convierte el texto de un compás ("C", "Am F", "G7, C") en acordes. Los acordes se reparten
 * el compás en partes iguales; si la división no es exacta, el último recibe el sobrante.
 */
export function parseMeasureChords(
  text: string,
  measureIndex: number,
  signature: TimeSignature,
  nextId: () => string,
): ChordLineResult {
  const tokens = text.split(SEPARATORS).filter((token) => token.length > 0);
  const valid = tokens.filter((token) => parseChord(token) !== null);
  const invalidSymbols = tokens.filter((token) => parseChord(token) === null);
  if (valid.length === 0) {
    return { chords: [], invalidSymbols };
  }
  const measureTicks = ticksPerMeasure(signature);
  const slot = Math.floor(measureTicks / valid.length);
  const start = measureStart(measureIndex, signature);
  const chords = valid.map((symbol, index) => ({
    id: nextId(),
    symbol,
    start: start + index * slot,
    duration: index === valid.length - 1 ? measureTicks - index * slot : slot,
  }));
  return { chords, invalidSymbols };
}

/** Texto editable de los acordes que empiezan en un compás, por ejemplo "Am F". */
export function formatMeasureChords(song: Song, measureIndex: number): string {
  return song.chords
    .filter((chord) => measureIndexAt(chord.start, song.timeSignature) === measureIndex)
    .sort((a, b) => a.start - b.start)
    .map((chord) => chord.symbol)
    .join(' ');
}

/** Reemplaza los acordes de un compás por los indicados. Devuelve una canción nueva. */
export function replaceMeasureChords(song: Song, measureIndex: number, chords: Chord[]): Song {
  const kept = song.chords.filter(
    (chord) => measureIndexAt(chord.start, song.timeSignature) !== measureIndex,
  );
  return { ...song, chords: [...kept, ...chords].sort((a, b) => a.start - b.start) };
}
