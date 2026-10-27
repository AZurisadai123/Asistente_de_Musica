import { Key as TonalKey, Note } from 'tonal';
import { Key, Mode, PitchClass } from '../model/song';
import { pitchClassOf } from './pitch';

/** Escala de la tonalidad. En menor se usa la escala natural. */
export function scaleNoteNames(key: Key): string[] {
  return key.mode === 'major'
    ? [...TonalKey.majorKey(key.tonic).scale]
    : [...TonalKey.minorKey(key.tonic).natural.scale];
}

/** Clases de altura (0 a 11) de la escala de la tonalidad. */
export function scalePitchClasses(key: Key): number[] {
  return scaleNoteNames(key)
    .map((name) => Note.chroma(name))
    .filter((chroma): chroma is number => typeof chroma === 'number');
}

export function isDiatonicPitch(midi: number, key: Key): boolean {
  return scalePitchClasses(key).includes(pitchClassOf(midi));
}

/**
 * Tríadas propias de la tonalidad, del grado I al VII. En menor se suman las de la
 * escala armónica (por ejemplo, E en la menor), porque la dominante mayor es lo habitual.
 */
export function diatonicTriads(key: Key): string[] {
  if (key.mode === 'major') {
    return [...TonalKey.majorKey(key.tonic).triads];
  }
  const minor = TonalKey.minorKey(key.tonic);
  return [...new Set([...minor.natural.triads, ...minor.harmonic.triads])];
}

const SOLFEGE: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
};

const ACCIDENTALS: Record<string, string> = { '#': ' sostenido', b: ' bemol', '': '' };

const MODE_NAMES: Record<Mode, string> = { major: 'mayor', minor: 'menor' };

/** { tonic: 'Bb', mode: 'minor' } → "Si bemol menor". */
export function keyDisplayName(key: Key): string {
  const letter = key.tonic.charAt(0);
  const accidental = key.tonic.slice(1);
  return `${SOLFEGE[letter]}${ACCIDENTALS[accidental] ?? ''} ${MODE_NAMES[key.mode]}`;
}

export const PITCH_CLASSES: readonly PitchClass[] = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
];
