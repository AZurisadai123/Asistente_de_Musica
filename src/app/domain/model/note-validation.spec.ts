import { validateNote } from './note-validation';
import { Note } from './song';

const valid: Note = { id: 'n1', pitch: 60, start: 0, duration: 480, velocity: 90 };

describe('validateNote', () => {
  it('acepta una nota válida', () => {
    expect(validateNote(valid)).toEqual([]);
  });

  it('rechaza alturas fuera del rango MIDI', () => {
    expect(validateNote({ ...valid, pitch: 128 })).toContain('pitch-out-of-range');
    expect(validateNote({ ...valid, pitch: 60.5 })).toContain('pitch-out-of-range');
  });

  it('rechaza inicios y duraciones que no son ticks válidos', () => {
    expect(validateNote({ ...valid, start: -10 })).toContain('invalid-start');
    expect(validateNote({ ...valid, duration: 0 })).toContain('invalid-duration');
    expect(validateNote({ ...valid, duration: 0.25 })).toContain('invalid-duration');
  });

  it('rechaza intensidades fuera de 1 a 127', () => {
    expect(validateNote({ ...valid, velocity: 0 })).toContain('velocity-out-of-range');
  });
});
