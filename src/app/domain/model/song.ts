import { Ticks, TimeSignature } from './time';

/**
 * Modelo compartido por el asistente de composición (A) y el transcriptor (B).
 * Las notas y los acordes viven en listas planas con inicio absoluto; los compases se
 * derivan cuando se necesitan, así una nota puede cruzar la barra sin pertenecer a dos compases.
 */
export const SONG_SCHEMA_VERSION = 1;

export type PitchClass =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Bb'
  | 'B';

export type Mode = 'major' | 'minor';

export interface Key {
  readonly tonic: PitchClass;
  readonly mode: Mode;
}

export type StyleId = 'pop-rock' | 'classical';

export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';

export interface Note {
  readonly id: string;
  /** Número MIDI, de 0 a 127 (60 = do central). */
  readonly pitch: number;
  readonly start: Ticks;
  readonly duration: Ticks;
  /** Intensidad MIDI, de 1 a 127. */
  readonly velocity: number;
  readonly lyric?: string;
}

export interface Chord {
  readonly id: string;
  /** Símbolo de cifrado americano, por ejemplo "Am7". */
  readonly symbol: string;
  readonly start: Ticks;
  readonly duration: Ticks;
}

/** Las secciones se alinean a compases completos. */
export interface Section {
  readonly id: string;
  readonly type: SectionType;
  readonly name: string;
  readonly startMeasure: number;
  readonly measureCount: number;
}

export interface Song {
  readonly schemaVersion: typeof SONG_SCHEMA_VERSION;
  readonly id: string;
  readonly title: string;
  readonly tempo: number;
  readonly timeSignature: TimeSignature;
  /** null cuando el usuario aún no la define ni se ha detectado. */
  readonly key: Key | null;
  readonly style: StyleId;
  readonly sections: readonly Section[];
  readonly notes: readonly Note[];
  readonly chords: readonly Chord[];
}
