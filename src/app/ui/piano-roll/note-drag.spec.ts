import { Note } from '../../domain/model/song';
import { DragState, draggedNote, hasChanged } from './note-drag';

const bounds = { lowestPitch: 48, highestPitch: 72 };
const original: Note = { id: 'a', pitch: 60, start: 480, duration: 480, velocity: 90 };

function drag(mode: DragState['mode']): DragState {
  return { mode, original, pointerTick: 600, pointerPitch: 60 };
}

describe('draggedNote', () => {
  it('mover desplaza inicio y altura alineados a la rejilla', () => {
    const moved = draggedNote(drag('move'), 600 + 250, 63, 240, bounds);
    expect(moved).toMatchObject({ start: 720, pitch: 63, duration: 480 });
  });

  it('mover no deja la nota antes del inicio ni fuera del rango', () => {
    const moved = draggedNote(drag('move'), 0, 99, 240, bounds);
    expect(moved.start).toBe(0);
    expect(moved.pitch).toBe(72);
  });

  it('estirar cambia la duración hasta la línea de rejilla más cercana', () => {
    expect(draggedNote(drag('resize'), 1400, 60, 240, bounds).duration).toBe(960);
  });

  it('estirar nunca deja una duración menor que la rejilla', () => {
    expect(draggedNote(drag('resize'), 100, 60, 240, bounds).duration).toBe(240);
  });

  it('crear se comporta como estirar la nota nueva', () => {
    expect(draggedNote(drag('create'), 1200, 70, 240, bounds)).toMatchObject({
      start: 480,
      pitch: 60,
      duration: 720,
    });
  });
});

describe('hasChanged', () => {
  it('detecta cambios de inicio, altura o duración', () => {
    expect(hasChanged(original, { ...original })).toBe(false);
    expect(hasChanged(original, { ...original, pitch: 61 })).toBe(true);
    expect(hasChanged(original, { ...original, duration: 240 })).toBe(true);
  });
});
