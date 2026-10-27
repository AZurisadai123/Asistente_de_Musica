import { Note } from '../../domain/model/song';
import { Ticks, TICKS_PER_QUARTER, ticksPerMeasure, TimeSignature } from '../../domain/model/time';

/**
 * Piano roll vertical: una columna por semitono (grave a la izquierda) y el tiempo hacia
 * arriba. El tick 0 queda en el borde inferior, junto al teclado, así las notas "caen".
 */
export interface PianoRollLayout {
  readonly lowestPitch: number;
  readonly highestPitch: number;
  readonly columnWidth: number;
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

/** Rango de alturas del editor: de Do2 a Do7. */
export const PIANO_ROLL_PITCH_RANGE = { lowestPitch: 36, highestPitch: 96 } as const;

/** Píxeles del borde superior (el final) de una nota que sirven para estirarla. */
export const RESIZE_HANDLE_PX = 6;

const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

export function isBlackKey(pitch: number): boolean {
  return BLACK_KEYS.has(pitch % 12);
}

export function gridWidth(layout: PianoRollLayout): number {
  return (layout.highestPitch - layout.lowestPitch + 1) * layout.columnWidth;
}

export function gridHeight(layout: PianoRollLayout): number {
  return ticksToPixels(layout.measures * ticksPerMeasure(layout.signature), layout);
}

export function ticksToPixels(ticks: Ticks, layout: PianoRollLayout): number {
  return (ticks / TICKS_PER_QUARTER) * layout.pixelsPerQuarter;
}

export function pitchToX(pitch: number, layout: PianoRollLayout): number {
  return (pitch - layout.lowestPitch) * layout.columnWidth;
}

/** Altura de la columna que contiene la coordenada x, limitada al rango visible. */
export function xToPitch(x: number, layout: PianoRollLayout): number {
  return clampPitch(layout.lowestPitch + Math.floor(x / layout.columnWidth), layout);
}

export function clampPitch(pitch: number, layout: PianoRollLayout): number {
  return Math.min(layout.highestPitch, Math.max(layout.lowestPitch, pitch));
}

/** Coordenada y de un instante: el tick 0 está abajo. */
export function tickToY(tick: Ticks, layout: PianoRollLayout): number {
  return gridHeight(layout) - ticksToPixels(tick, layout);
}

export function yToTick(y: number, layout: PianoRollLayout): Ticks {
  const ticks = ((gridHeight(layout) - y) / layout.pixelsPerQuarter) * TICKS_PER_QUARTER;
  return Math.max(0, Math.round(ticks));
}

export function visiblePitches(layout: PianoRollLayout): number[] {
  const count = layout.highestPitch - layout.lowestPitch + 1;
  return Array.from({ length: count }, (_, i) => layout.lowestPitch + i);
}

/** El inicio de la nota es su borde inferior y el final, el superior. */
export function noteRect(note: Note, layout: PianoRollLayout): Rect {
  return {
    x: pitchToX(note.pitch, layout),
    y: tickToY(note.start + note.duration, layout),
    width: layout.columnWidth,
    height: ticksToPixels(note.duration, layout),
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
      const handle = Math.min(RESIZE_HANDLE_PX, rect.height / 3);
      return { note: notes[i], zone: y < rect.y + handle ? 'resize' : 'body' };
    }
  }
  return null;
}

/** Rectángulo normalizado entre dos esquinas cualesquiera. */
export function rectFromPoints(ax: number, ay: number, bx: number, by: number): Rect {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    width: Math.abs(bx - ax),
    height: Math.abs(by - ay),
  };
}

/** Notas que tocan el recuadro de selección. */
export function notesInRect(notes: readonly Note[], box: Rect, layout: PianoRollLayout): Note[] {
  return notes.filter((note) => {
    const r = noteRect(note, layout);
    return (
      r.x < box.x + box.width &&
      r.x + r.width > box.x &&
      r.y < box.y + box.height &&
      r.y + r.height > box.y
    );
  });
}

/** Inicio de la celda de la rejilla que contiene el tick. */
export function snapDown(tick: Ticks, grid: Ticks): Ticks {
  return Math.floor(tick / grid) * grid;
}

/** Posiciones y de las líneas horizontales: las de compás se marcan como fuertes. */
export function gridLines(layout: PianoRollLayout, grid: Ticks): { y: number; strong: boolean }[] {
  const measure = ticksPerMeasure(layout.signature);
  const total = layout.measures * measure;
  const lines: { y: number; strong: boolean }[] = [];
  for (let tick = 0; tick <= total; tick += grid) {
    lines.push({ y: tickToY(tick, layout), strong: tick % measure === 0 });
  }
  return lines;
}

/**
 * Tecla blanca con forma de piano: ocupa su columna más la mitad de las negras vecinas,
 * así queda alineada con las notas y se ve como un teclado real.
 */
export function whiteKeyRect(pitch: number, layout: PianoRollLayout, height: number): Rect {
  const half = layout.columnWidth / 2;
  const left = pitchToX(pitch, layout) - (isBlackKey(pitch - 1) ? half : 0);
  const right = pitchToX(pitch, layout) + layout.columnWidth + (isBlackKey(pitch + 1) ? half : 0);
  const x = Math.max(0, left);
  return { x, y: 0, width: Math.min(gridWidth(layout), right) - x, height };
}

export function blackKeyRect(pitch: number, layout: PianoRollLayout, height: number): Rect {
  return { x: pitchToX(pitch, layout), y: 0, width: layout.columnWidth, height: height * 0.62 };
}

export interface KeyboardKey {
  readonly pitch: number;
  readonly black: boolean;
  readonly rect: Rect;
}

/** Teclas listas para dibujar: primero las blancas y después las negras, que van encima. */
export function keyboardKeys(layout: PianoRollLayout, height: number): KeyboardKey[] {
  const keys = visiblePitches(layout).map((pitch) => {
    const black = isBlackKey(pitch);
    const rect = black ? blackKeyRect(pitch, layout, height) : whiteKeyRect(pitch, layout, height);
    return { pitch, black, rect };
  });
  return [...keys.filter((k) => !k.black), ...keys.filter((k) => k.black)];
}
