import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SongStore } from '../editor/song-store';
import { ID_GENERATOR } from '../ports.tokens';
import { PianoRoll } from './piano-roll';

/** Layout del componente: Do7 (96) arriba, filas de 14 px y 64 px por negra. */
const ROW = 14;
const QUARTER_PX = 64;
const yFor = (pitch: number) => (96 - pitch) * ROW + ROW / 2;

describe('PianoRoll', () => {
  let fixture: ComponentFixture<PianoRoll>;
  let store: SongStore;
  let svg: SVGSVGElement;

  beforeEach(() => {
    let n = 0;
    TestBed.configureTestingModule({
      imports: [PianoRoll],
      providers: [SongStore, { provide: ID_GENERATOR, useValue: { next: () => `id${++n}` } }],
    });
    fixture = TestBed.createComponent(PianoRoll);
    store = TestBed.inject(SongStore);
    store.removeNotes(store.song().notes.map((note) => note.id));
    fixture.detectChanges();
    svg = fixture.nativeElement.querySelector('svg.grid');
  });

  function pointer(type: string, x: number, y: number, button = 0): void {
    svg.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, button, bubbles: true }));
    fixture.detectChanges();
  }

  it('un clic en una celda vacía crea una nota de una corchea', () => {
    pointer('pointerdown', QUARTER_PX * 1.25, yFor(67));
    pointer('pointerup', QUARTER_PX * 1.25, yFor(67));
    expect(store.song().notes).toEqual([
      expect.objectContaining({ pitch: 67, start: 480, duration: 240 }),
    ]);
  });

  it('arrastrar al crear define la duración, y se deshace en un solo paso', () => {
    pointer('pointerdown', 10, yFor(60));
    pointer('pointermove', QUARTER_PX * 2, yFor(60));
    pointer('pointerup', QUARTER_PX * 2, yFor(60));
    expect(store.song().notes[0].duration).toBe(960);
    store.undo();
    expect(store.song().notes).toEqual([]);
  });

  it('arrastrar una nota la mueve', () => {
    store.addNote(60, 0, 480);
    fixture.detectChanges();
    pointer('pointerdown', 10, yFor(60));
    pointer('pointermove', 10 + QUARTER_PX, yFor(62));
    pointer('pointerup', 10 + QUARTER_PX, yFor(62));
    expect(store.song().notes[0]).toMatchObject({ pitch: 62, start: 480, duration: 480 });
    expect(store.history().undoLabel).toBe('Mover nota');
  });

  it('arrastrar el borde derecho estira la nota', () => {
    store.addNote(60, 0, 480);
    fixture.detectChanges();
    pointer('pointerdown', QUARTER_PX - 2, yFor(60));
    pointer('pointermove', QUARTER_PX * 3, yFor(60));
    pointer('pointerup', QUARTER_PX * 3, yFor(60));
    expect(store.song().notes[0].duration).toBe(1440);
  });

  it('clic derecho borra la nota', () => {
    store.addNote(60, 0, 480);
    fixture.detectChanges();
    pointer('contextmenu', 10, yFor(60), 2);
    expect(store.song().notes).toEqual([]);
  });

  it('Supr borra la nota seleccionada y Ctrl+Z la recupera', () => {
    store.addNote(60, 0, 480);
    fixture.detectChanges();
    pointer('pointerdown', 10, yFor(60));
    pointer('pointerup', 10, yFor(60));
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(store.song().notes).toEqual([]);
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(store.song().notes).toHaveLength(1);
  });
});
