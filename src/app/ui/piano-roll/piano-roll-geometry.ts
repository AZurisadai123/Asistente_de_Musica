import { Note } from '../../domain/model/song';
import { Ticks, TICKS_PER_QUARTER, ticksPerMeasure, TimeSignature } from '../../domain/model/time';

/** Dimensiones del piano roll. Las filas van de la nota más aguda (arriba) a la más grave. */
export interface PianoRollLayout {
  readonly lowestPitch: number;
  readonly highestPitch: number;
  readonly rowHeight: number;
  readonly pixelsPerQuarter: number;
  readonly measures: number;
  readonly signature: TimeSignature;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type HitZone = 'body' | 'resize';

export interface NoteHit {
  readonly note: Note;
  readonly zone: HitZone;
}

/** Píxeles del borde derecho de una nota que sirven para estirarla. */
export const RESIZE_HANDLE_PX = 6;

const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

export function tickToX(tick: Ticks, layout: PianoRollLayout): number {
  return (tick / TICKS_PER_QUARTER) * layout.pixelsPerQuarter;
}

export function xToTick(x: number, layout: PianoRollLayout): Ticks {
  return Math.max(0, Math.round((x / layout.pixelsPerQuarter) * TICKS_PER_QUARTER));
}

export function pitchToY(pitch: number, layout: PianoRollLayout): number {
  return (layout.highestPitch - pitch) * layout.rowHeight;
}

/** Altura de la fila que contiene la coordenada y, limitada al rango visible. */
export function yToPitch(y: number, layout: PianoRollLayout): number {
  const pitch = layout.highestPitch - Math.floor(y / layout.rowHeight);
  return clampPitch(pitch, layout);
}

export function clampPitch(pitch: number, layout: PianoRollLayout): number {
  return Math.min(layout.highestPitch, Math.max(layout.lowestPitch, pitch));
}

export function gridWidth(layout: PianoRollLayout): number {
  return tickToX(layout.measures * ticksPerMeasure(layout.signature), layout);
}

export function gridHeight(layout: PianoRollLayout): number {
  return (layout.highestPitch - layout.lowestPitch + 1) * layout.rowHeight;
}

export function visiblePitches(layout: PianoRollLayout): number[] {
  const count = layout.highestPitch - layout.lowestPitch + 1;
  return Array.from({ length: count }, (_, i) => layout.highestPitch - i);
}

export function isBlackKey(pitch: number): boolean {
  return BLACK_KEYS.has(pitch % 12);
}

export function noteRect(note: Note, layout: PianoRollLayout): Rect {
  return {
    x: tickToX(note.start, layout),
    y: pitchToY(note.pitch, layout),
    width: tickToX(note.duration, layout),
    height: layout.rowHeight,
  };
}

/** Nota bajo el punto (la última dibujada gana) y si el punto está en la zona para estirar. */
export function hitTest(
  notes: readonly Note[],
  x: number,
  y: number,
  layout: PianoRollLayout,
): NoteHit | null {
  for (let i = notes.length - 1; i >= 0; i--) {
    const rect = noteRect(notes[i], layout);
    const inside =
      x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
    if (inside) {
      const handle = Math.min(RESIZE_HANDLE_PX, rect.width / 3);
      return { note: notes[i], zone: x >= rect.x + rect.width - handle ? 'resize' : 'body' };
    }
  }
  return null;
}

/** Inicio de la celda de la rejilla que contiene el tick. */
export function snapDown(tick: Ticks, grid: Ticks): Ticks {
  return Math.floor(tick / grid) * grid;
}

/** Posiciones x de las líneas verticales: las de compás se marcan como fuertes. */
export function gridLines(layout: PianoRollLayout, grid: Ticks): { x: number; strong: boolean }[] {
  const measure = ticksPerMeasure(layout.signature);
  const total = layout.measures * measure;
  const lines: { x: number; strong: boolean }[] = [];
  for (let tick = 0; tick <= total; tick += grid) {
    lines.push({ x: tickToX(tick, layout), strong: tick % measure === 0 });
  }
  return lines;
}
