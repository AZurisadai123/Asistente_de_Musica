import { TestBed } from '@angular/core/testing';
import { ID_GENERATOR } from '../ports.tokens';
import { SongStore } from './song-store';

describe('SongStore', () => {
  let store: SongStore;

  beforeEach(() => {
    let n = 0;
    TestBed.configureTestingModule({
      providers: [SongStore, { provide: ID_GENERATOR, useValue: { next: () => `id${++n}` } }],
    });
    store = TestBed.inject(SongStore);
  });

  it('empieza con la canción de ejemplo y sin historial', () => {
    expect(store.song().notes.length).toBeGreaterThan(0);
    expect(store.history().canUndo).toBe(false);
  });

  it('agrega varias notas en un solo paso de deshacer', () => {
    const before = store.song().notes.length;
    const ids = store.addNotes([
      { pitch: 60, start: 0, duration: 240, velocity: 90 },
      { pitch: 62, start: 240, duration: 240, velocity: 90 },
    ]);
    expect(ids).toHaveLength(2);
    expect(store.song().notes).toHaveLength(before + 2);
    store.undo();
    expect(store.song().notes).toHaveLength(before);
  });

  describe('setMeasureChords', () => {
    it('reemplaza los acordes del compás y se puede deshacer', () => {
      expect(store.setMeasureChords(0, 'F G')).toEqual([]);
      const measure0 = store.song().chords.filter((c) => c.start < 1920);
      expect(measure0.map((c) => c.symbol)).toEqual(['F', 'G']);
      expect(store.history().undoLabel).toBe('Cambiar acordes');
      store.undo();
      expect(
        store
          .song()
          .chords.filter((c) => c.start < 1920)
          .map((c) => c.symbol),
      ).toEqual(['C']);
    });

    it('con un símbolo desconocido no cambia nada y lo devuelve', () => {
      const chords = store.song().chords;
      expect(store.setMeasureChords(0, 'F Xq')).toEqual(['Xq']);
      expect(store.song().chords).toBe(chords);
      expect(store.history().canUndo).toBe(false);
    });

    it('escribir lo mismo no agrega un paso al historial', () => {
      store.setMeasureChords(0, 'C');
      expect(store.history().canUndo).toBe(false);
    });

    it('un texto vacío borra los acordes del compás', () => {
      store.setMeasureChords(1, '');
      expect(store.song().chords.map((c) => c.symbol)).toEqual(['C', 'F', 'G']);
    });
  });
});
