import { Note } from '../../domain/model/song';
import { snapToGrid, Ticks } from '../../domain/model/time';

/**
 * create: nota nueva que se alarga mientras se arrastra.
 * move: cambia inicio y altura conservando la duración.
 * resize: cambia la duración arrastrando el borde derecho.
 */
export type DragMode = 'create' | 'move' | 'resize';

export interface DragState {
  readonly mode: DragMode;
  /** La nota tal como estaba al empezar a arrastrar. */
  readonly original: Note;
  readonly pointerTick: Ticks;
  readonly pointerPitch: number;
}

export interface PitchBounds {
  readonly lowestPitch: number;
  readonly highestPitch: number;
}

/** Nota resultante para la posición actual del puntero. Todo queda alineado a la rejilla. */
export function draggedNote(
  drag: DragState,
  tick: Ticks,
  pitch: number,
  grid: Ticks,
  bounds: PitchBounds,
): Note {
  const { original } = drag;
  if (drag.mode === 'move') {
    const delta = snapToGrid(tick - drag.pointerTick, grid);
    const pitchDelta = pitch - drag.pointerPitch;
    return {
      ...original,
      start: Math.max(0, original.start + delta),
      pitch: Math.min(
        bounds.highestPitch,
        Math.max(bounds.lowestPitch, original.pitch + pitchDelta),
      ),
    };
  }
  const end = snapToGrid(tick, grid);
  return { ...original, duration: Math.max(grid, end - original.start) };
}

export function hasChanged(before: Note, after: Note): boolean {
  return (
    before.start !== after.start ||
    before.pitch !== after.pitch ||
    before.duration !== after.duration
  );
}
