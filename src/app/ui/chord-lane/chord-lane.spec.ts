import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TIME } from '../../domain/model/time';
import { SongStore } from '../editor/song-store';
import { PianoRollLayout } from '../piano-roll/piano-roll-geometry';
import { ID_GENERATOR } from '../ports.tokens';
import { ChordLane } from './chord-lane';

const layout: PianoRollLayout = {
  lowestPitch: 36,
  highestPitch: 96,
  columnWidth: 14,
  pixelsPerQuarter: 48,
  measures: 6,
  signature: COMMON_TIME,
};

describe('ChordLane', () => {
  let fixture: ComponentFixture<ChordLane>;
  let store: SongStore;

  beforeEach(() => {
    let n = 0;
    TestBed.configureTestingModule({
      imports: [ChordLane],
      providers: [SongStore, { provide: ID_GENERATOR, useValue: { next: () => `id${++n}` } }],
    });
    fixture = TestBed.createComponent(ChordLane);
    fixture.componentRef.setInput('layout', layout);
    store = TestBed.inject(SongStore);
    fixture.detectChanges();
  });

  function inputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input.chord-input'));
  }

  function type(input: HTMLInputElement, text: string): void {
    input.value = text;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('muestra una casilla por compás con los acordes actuales', () => {
    expect(inputs().map((input) => input.value)).toEqual(['C', 'Am', 'F', 'G', '', '']);
  });

  it('el compás 1 queda abajo, junto al teclado', () => {
    const cells = fixture.nativeElement.querySelectorAll('.cell') as NodeListOf<HTMLElement>;
    const first = parseFloat(cells[0].style.top);
    const second = parseFloat(cells[1].style.top);
    expect(first).toBeGreaterThan(second);
  });

  it('cambiar el texto actualiza los acordes del compás', () => {
    type(inputs()[4], 'Dm G7');
    const chords = store.song().chords.filter((c) => c.start >= 4 * 1920);
    expect(chords.map((c) => c.symbol)).toEqual(['Dm', 'G7']);
  });

  it('marca la casilla si hay un acorde que no existe', () => {
    const input = inputs()[0];
    type(input, 'C Hm');
    expect(input.classList).toContain('invalid');
    expect(input.title).toContain('Hm');
    expect(input.value).toBe('C Hm');

    type(input, 'C');
    expect(input.classList).not.toContain('invalid');
  });
});
