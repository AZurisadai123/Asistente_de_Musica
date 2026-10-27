import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Playback } from '../../application/ports/in/playback.port';
import { PlaybackSession } from '../editor/playback-session';
import { SongStore } from '../editor/song-store';
import { ID_GENERATOR, PLAYBACK } from '../ports.tokens';
import { PianoRoll } from './piano-roll';

/**
 * Layout del componente: Do2 (36) a la izquierda en columnas de 14 px, 48 px por negra y
 * 8 compases de 4/4, así que la rejilla mide 8 * 4 * 48 = 1536 px de alto y el tick 0 está abajo.
 */
const COLUMN = 14;
const QUARTER_PX = 48;
const HEIGHT = 1536;
const xFor = (pitch: number) => (pitch - 36) * COLUMN + COLUMN / 2;
const yFor = (tick: number) => HEIGHT - (tick / 480) * QUARTER_PX;

describe('PianoRoll', () => {
  let fixture: ComponentFixture<PianoRoll>;
  let store: SongStore;
  let svg: SVGSVGElement;
  let playback: { playing: boolean; tick: number } & Playback;

  beforeEach(() => {
    let n = 0;
    playback = {
      playing: false,
      tick: 0,
      async play() {
        this.playing = true;
      },
      stop() {
        this.playing = false;
      },
      isPlaying() {
        return this.playing;
      },
      currentTick() {
        return this.tick;
      },
      setMetronome: async () => undefined,
      isMetronomeEnabled: () => false,
    };
    TestBed.configureTestingModule({
      imports: [PianoRoll],
      providers: [
        SongStore,
        PlaybackSession,
        { provide: ID_GENERATOR, useValue: { next: () => `id${++n}` } },
        { provide: PLAYBACK, useValue: playback },
      ],
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

  it('dibuja el teclado debajo de la rejilla con una tecla por semitono', () => {
    const keyboard = fixture.nativeElement.querySelector('svg.keyboard');
    expect(keyboard.querySelectorAll('rect.key')).toHaveLength(61);
    expect(keyboard.querySelectorAll('rect.key.black')).toHaveLength(25);
  });

  it('un clic en una celda vacía crea una corchea', () => {
    pointer('pointerdown', xFor(67), yFor(480 + 100));
    pointer('pointerup', xFor(67), yFor(480 + 100));
    expect(store.song().notes).toEqual([
      expect.objectContaining({ pitch: 67, start: 480, duration: 240 }),
    ]);
  });

  it('arrastrar hacia arriba al crear define la duración, en un solo paso de deshacer', () => {
    pointer('pointerdown', xFor(60), yFor(50));
    pointer('pointermove', xFor(60), yFor(960));
    pointer('pointerup', xFor(60), yFor(960));
    expect(store.song().notes[0]).toMatchObject({ start: 0, duration: 960 });
    store.undo();
    expect(store.song().notes).toEqual([]);
  });

  it('arrastrar una nota la mueve en tiempo y altura', () => {
    store.addNote(60, 0, 480);
    fixture.detectChanges();
    pointer('pointerdown', xFor(60), yFor(100));
    pointer('pointermove', xFor(62), yFor(100 + 480));
    pointer('pointerup', xFor(62), yFor(100 + 480));
    expect(store.song().notes[0]).toMatchObject({ pitch: 62, start: 480, duration: 480 });
    expect(store.history().undoLabel).toBe('Mover nota');
  });

  it('arrastrar el borde superior estira la nota', () => {
    store.addNote(60, 0, 480);
    fixture.detectChanges();
    pointer('pointerdown', xFor(60), yFor(480) + 2);
    pointer('pointermove', xFor(60), yFor(1440));
    pointer('pointerup', xFor(60), yFor(1440));
    expect(store.song().notes[0].duration).toBe(1440);
  });

  it('clic derecho borra la nota', () => {
    store.addNote(60, 0, 480);
    fixture.detectChanges();
    pointer('contextmenu', xFor(60), yFor(100), 2);
    expect(store.song().notes).toEqual([]);
  });

  it('Supr borra la nota seleccionada y Ctrl+Z la recupera', () => {
    store.addNote(60, 0, 480);
    fixture.detectChanges();
    pointer('pointerdown', xFor(60), yFor(100));
    pointer('pointerup', xFor(60), yFor(100));
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(store.song().notes).toEqual([]);
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(store.song().notes).toHaveLength(1);
  });

  it('al reproducir muestra la línea de posición e ilumina las teclas que suenan', async () => {
    store.addNote(60, 0, 960);
    playback.tick = 480;
    await TestBed.inject(PlaybackSession).toggle(store.song());
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('line.playhead')?.getAttribute('y1')).toBe(String(yFor(480)));
    expect(element.querySelectorAll('rect.key.active')).toHaveLength(1);
  });
});
