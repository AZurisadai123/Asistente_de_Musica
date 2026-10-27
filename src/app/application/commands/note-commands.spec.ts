import { Note, Song } from '../../domain/model/song';
import { createEmptySong } from '../../domain/model/song-factory';
import { CommandHistory } from './command-history';
import { AddNotesCommand, RemoveNotesCommand, UpdateNotesCommand } from './note-commands';

const n = (id: string, start: number): Note => ({
  id,
  pitch: 60,
  start,
  duration: 480,
  velocity: 90,
});

const base: Song = { ...createEmptySong('s'), notes: [n('a', 0)] };

describe('comandos de notas', () => {
  it('agregar y deshacer vuelve al estado anterior', () => {
    const command = new AddNotesCommand([n('b', 480)]);
    const after = command.apply(base);
    expect(after.notes).toHaveLength(2);
    expect(command.revert(after)).toEqual(base);
    expect(command.label).toBe('Agregar nota');
  });

  it('borrar y deshacer restaura la nota completa', () => {
    const command = new RemoveNotesCommand([n('a', 0)]);
    const after = command.apply(base);
    expect(after.notes).toEqual([]);
    expect(command.revert(after)).toEqual(base);
  });

  it('actualizar aplica la versión nueva y deshacer la anterior', () => {
    const moved = { ...n('a', 960), pitch: 64 };
    const command = new UpdateNotesCommand('Mover nota', [n('a', 0)], [moved]);
    const after = command.apply(base);
    expect(after.notes).toEqual([moved]);
    expect(command.revert(after)).toEqual(base);
  });
});

describe('CommandHistory', () => {
  it('deshace y rehace en orden', () => {
    const history = new CommandHistory();
    let song = history.execute(new AddNotesCommand([n('b', 480)]), base);
    song = history.execute(new AddNotesCommand([n('c', 960)]), song);
    expect(history.undoLabel()).toBe('Agregar nota');

    song = history.undo(song)!;
    expect(song.notes.map((x) => x.id)).toEqual(['a', 'b']);
    song = history.undo(song)!;
    expect(song).toEqual(base);
    expect(history.undo(song)).toBeNull();

    song = history.redo(song)!;
    expect(song.notes.map((x) => x.id)).toEqual(['a', 'b']);
    expect(history.canRedo()).toBe(true);
  });

  it('un comando nuevo vacía la pila de rehacer', () => {
    const history = new CommandHistory();
    let song = history.execute(new AddNotesCommand([n('b', 480)]), base);
    song = history.undo(song)!;
    history.execute(new AddNotesCommand([n('c', 960)]), song);
    expect(history.canRedo()).toBe(false);
  });

  it('respeta el límite de pasos guardados', () => {
    const history = new CommandHistory(2);
    let song = base;
    ['b', 'c', 'd'].forEach((id, i) => {
      song = history.execute(new AddNotesCommand([n(id, (i + 1) * 480)]), song);
    });
    song = history.undo(song)!;
    song = history.undo(song)!;
    expect(history.canUndo()).toBe(false);
    expect(song.notes.map((x) => x.id)).toEqual(['a', 'b']);
  });
});
