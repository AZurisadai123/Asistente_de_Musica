import { Song } from '../model/song';
import {
  measureStart,
  Ticks,
  TICKS_PER_QUARTER,
  ticksPerBeat,
  ticksPerMeasure,
} from '../model/time';
import { chordVoicing } from '../theory/voicing';
import { songLengthInMeasures } from './measures';

export type PlaybackEventKind = 'melody' | 'chord' | 'click';

/** Evento listo para que un adaptador de audio lo programe. Tiempos en segundos. */
export interface PlaybackEvent {
  readonly kind: PlaybackEventKind;
  readonly time: number;
  readonly duration: number;
  readonly pitches: readonly number[];
  /** Intensidad de 0 a 1. */
  readonly velocity: number;
}

export interface PlaybackOptions {
  readonly fromTick?: Ticks;
  readonly metronome?: boolean;
}

const CHORD_VELOCITY = 0.45;
const CLICK_DURATION = 0.05;
const ACCENT_PITCH = 84;
const CLICK_PITCH = 77;

/** El tempo se expresa en negras por minuto. */
export function ticksToSeconds(ticks: Ticks, tempo: number): number {
  return (ticks / TICKS_PER_QUARTER) * (60 / tempo);
}

export function secondsToTicks(seconds: number, tempo: number): Ticks {
  return Math.round((seconds * tempo * TICKS_PER_QUARTER) / 60);
}

/** Último tick de la canción: el final del último compás ocupado. */
export function songEndTick(song: Song): Ticks {
  return measureStart(songLengthInMeasures(song), song.timeSignature);
}

/**
 * Convierte la canción en eventos ordenados por tiempo, relativos a fromTick. Solo se incluye
 * lo que empieza en fromTick o después; los acordes con símbolo desconocido no suenan.
 */
export function buildPlaybackEvents(song: Song, options: PlaybackOptions = {}): PlaybackEvent[] {
  const fromTick = options.fromTick ?? 0;
  const toTime = (tick: Ticks) => ticksToSeconds(tick - fromTick, song.tempo);
  const toDuration = (ticks: Ticks) => ticksToSeconds(ticks, song.tempo);

  const melody: PlaybackEvent[] = song.notes
    .filter((note) => note.start >= fromTick)
    .map((note) => ({
      kind: 'melody',
      time: toTime(note.start),
      duration: toDuration(note.duration),
      pitches: [note.pitch],
      velocity: note.velocity / 127,
    }));

  const chords: PlaybackEvent[] = song.chords
    .filter((chord) => chord.start >= fromTick)
    .flatMap((chord) => {
      const pitches = chordVoicing(chord.symbol);
      if (!pitches) return [];
      return [
        {
          kind: 'chord' as const,
          time: toTime(chord.start),
          duration: toDuration(chord.duration),
          pitches,
          velocity: CHORD_VELOCITY,
        },
      ];
    });

  const clicks = options.metronome ? metronomeEvents(song, fromTick, toTime) : [];
  return [...melody, ...chords, ...clicks].sort((a, b) => a.time - b.time);
}

function metronomeEvents(
  song: Song,
  fromTick: Ticks,
  toTime: (tick: Ticks) => number,
): PlaybackEvent[] {
  const beat = ticksPerBeat(song.timeSignature);
  const measure = ticksPerMeasure(song.timeSignature);
  const end = songEndTick(song);
  const events: PlaybackEvent[] = [];
  for (let tick = Math.ceil(fromTick / beat) * beat; tick < end; tick += beat) {
    const accent = tick % measure === 0;
    events.push({
      kind: 'click',
      time: toTime(tick),
      duration: CLICK_DURATION,
      pitches: [accent ? ACCENT_PITCH : CLICK_PITCH],
      velocity: accent ? 0.9 : 0.6,
    });
  }
  return events;
}
