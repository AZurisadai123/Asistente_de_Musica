import { Song } from '../../domain/model/song';
import { createEmptySong } from '../../domain/model/song-factory';
import { AddNotesCommand } from '../commands/note-commands';
import { SongEditor } from './song-editor';

const note = { id: 'n', pitch: 60, start: 0, duration: 480, velocity: 90 };

describe('SongEditor', () => {
  it('ejecuta comandos y avisa a los suscriptores', () => {
    const editor = new SongEditor(createEmptySong('s'));
    const received: Song[] = [];
    editor.subscribe((song) => received.push(song));

    editor.execute(new AddNotesCommand([note]));

    expect(editor.song.notes).toEqual([note]);
    expect(received).toHaveLength(1);
    expect(editor.canUndo()).toBe(true);
  });

  it('deshace y rehace, y devuelve false cuando no hay nada', () => {
    const editor = new SongEditor(createEmptySong('s'));
    expect(editor.undo()).toBe(false);
    editor.execute(new AddNotesCommand([note]));
    expect(editor.undo()).toBe(true);
    expect(editor.song.notes).toEqual([]);
    expect(editor.redo()).toBe(true);
    expect(editor.song.notes).toEqual([note]);
  });

  it('load reemplaza la canción y borra el historial', () => {
    const editor = new SongEditor(createEmptySong('s'));
    editor.execute(new AddNotesCommand([note]));
    editor.load(createEmptySong('otra'));
    expect(editor.song.id).toBe('otra');
    expect(editor.canUndo()).toBe(false);
  });

  it('deja de avisar al cancelar la suscripción', () => {
    const editor = new SongEditor(createEmptySong('s'));
    const listener = vi.fn();
    const unsubscribe = editor.subscribe(listener);
    unsubscribe();
    editor.execute(new AddNotesCommand([note]));
    expect(listener).not.toHaveBeenCalled();
  });
});
