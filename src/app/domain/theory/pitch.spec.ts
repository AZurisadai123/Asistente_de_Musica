import { parseChord, parsePitch, pitchClassOf, pitchName } from './pitch';

describe('pitch', () => {
  it('convierte entre número MIDI y nombre', () => {
    expect(pitchName(60)).toBe('C4');
    expect(pitchName(61)).toBe('Db4');
    expect(pitchName(61, true)).toBe('C#4');
    expect(parsePitch('A4')).toBe(69);
    expect(parsePitch('no-es-nota')).toBeNull();
  });

  it('obtiene la clase de altura', () => {
    expect(pitchClassOf(60)).toBe(0);
    expect(pitchClassOf(71)).toBe(11);
  });

  it('interpreta símbolos de acorde', () => {
    expect(parseChord('Am7')).toEqual({ symbol: 'Am7', root: 'A', pitchClasses: [9, 0, 4, 7] });
    expect(parseChord(' G ')?.pitchClasses).toEqual([7, 11, 2]);
    expect(parseChord('Xyz')).toBeNull();
  });
});
