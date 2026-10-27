/**
 * Tiempo musical en ticks enteros. 480 por negra es la resolución estándar de MIDI,
 * así que la exportación a MIDI no necesita conversiones y nunca hay errores de redondeo.
 */
export type Ticks = number;

export const TICKS_PER_QUARTER: Ticks = 480;

export type BeatUnit = 1 | 2 | 4 | 8 | 16;

export interface TimeSignature {
  readonly beats: number;
  readonly beatUnit: BeatUnit;
}

export const COMMON_TIME: TimeSignature = { beats: 4, beatUnit: 4 };

export function isValidTicks(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function ticksPerBeat(signature: TimeSignature): Ticks {
  return (TICKS_PER_QUARTER * 4) / signature.beatUnit;
}

export function ticksPerMeasure(signature: TimeSignature): Ticks {
  return signature.beats * ticksPerBeat(signature);
}

/** Índice de compás (desde 0) que contiene el tick indicado. */
export function measureIndexAt(tick: Ticks, signature: TimeSignature): number {
  return Math.floor(tick / ticksPerMeasure(signature));
}

export function measureStart(measureIndex: number, signature: TimeSignature): Ticks {
  return measureIndex * ticksPerMeasure(signature);
}

/** Ajusta un tick a la rejilla más cercana (por ejemplo, 240 para corcheas). */
export function snapToGrid(tick: Ticks, grid: Ticks): Ticks {
  return Math.round(tick / grid) * grid;
}
