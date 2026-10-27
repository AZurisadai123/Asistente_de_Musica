import { TestBed } from '@angular/core/testing';
import { EditorActions } from './editor-actions';
import { PlaybackSession } from './playback-session';
import { SongStore } from './song-store';
import { ID_GENERATOR, PLAYBACK } from '../ports.tokens';

describe('EditorActions', () => {
  let store: SongStore;
  let actions: EditorActions;
  let previewed: number[];

  beforeEach(() => {
    let n = 0;
    previewed = [];
    TestBed.configureTestingModule({
      providers: [
        SongStore,
        EditorActions,
        { provide: PlaybackSession, useValue: { previewPitch: (p: number) => previewed.push(p) } },
        { provide: PLAYBACK, useValue: {} },
        { provide: ID_GENERATOR, useValue: { next: () => `id${++n}` } },
      ],
    });
    store = TestBed.inject(SongStore);
    actions = TestBed.inject(EditorActions);
    store.removeNotes(store.song().notes.map((note) => note.id));
  });

  function addTwoNotes(): string[] {
    return [store.addNote(60, 0, 480), store.addNote(64, 480, 480)];
  }

  it('selecciona, alterna y limpia', () => {
    const [a, b] = addTwoNotes();
    actions.select([a]);
    actions.toggle(b);
    expect([...actions.selected()]).toEqual([a, b]);
    actions.toggle(a);
    expect([...actions.selected()]).toEqual([b]);
    actions.run({ type: 'clearSelection' }, 240);
    expect(actions.selected().size).toBe(0);
    actions.run({ type: 'selectAll' }, 240);
    expect(actions.selected().size).toBe(2);
  });

  it('borra la selección en un solo paso de deshacer', () => {
    addTwoNotes();
    actions.run({ type: 'selectAll' }, 240);
    actions.run({ type: 'delete' }, 240);
    expect(store.song().notes).toEqual([]);
    store.undo();
    expect(store.song().notes).toHaveLength(2);
  });

  it('duplica la selección justo después de sí misma y selecciona la copia', () => {
    addTwoNotes();
    actions.run({ type: 'selectAll' }, 240);
    actions.run({ type: 'duplicate' }, 240);
    const starts = store.song().notes.map((note) => note.start);
    expect(starts).toEqual([0, 480, 960, 1440]);
    expect(actions.selectedNotes().map((note) => note.start)).toEqual([960, 1440]);
  });

  it('pegar varias veces encadena las copias', () => {
    const [a] = addTwoNotes();
    actions.select([a]);
    actions.run({ type: 'copy' }, 240);
    actions.run({ type: 'paste' }, 240);
    actions.run({ type: 'paste' }, 240);
    const copies = store.song().notes.filter((note) => note.pitch === 60);
    expect(copies.map((note) => note.start)).toEqual([0, 480, 960]);
  });

  it('pegar sin haber copiado no hace nada', () => {
    actions.run({ type: 'paste' }, 240);
    expect(store.song().notes).toEqual([]);
  });

  it('mueve la selección con las flechas y toca la nota nueva', () => {
    const [a, b] = addTwoNotes();
    actions.select([a, b]);
    actions.run({ type: 'move', gridSteps: 1, semitones: 2 }, 240);
    const moved = store.song().notes;
    expect(moved.map((note) => [note.pitch, note.start])).toEqual([
      [62, 240],
      [66, 720],
    ]);
    expect(store.history().undoLabel).toBe('Mover notas');
    expect(previewed).toEqual([62]);
  });

  it('no mueve antes del tick 0', () => {
    const [a] = addTwoNotes();
    actions.select([a]);
    actions.run({ type: 'move', gridSteps: -1, semitones: 0 }, 240);
    expect(store.history().undoLabel).toBe('Agregar nota');
  });
});
