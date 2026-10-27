import {
  diatonicTriads,
  isDiatonicPitch,
  keyDisplayName,
  scaleNoteNames,
  scalePitchClasses,
} from './keys';

describe('keys', () => {
  it('obtiene la escala mayor y la menor natural', () => {
    expect(scaleNoteNames({ tonic: 'G', mode: 'major' })).toEqual([
      'G',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F#',
    ]);
    expect(scalePitchClasses({ tonic: 'A', mode: 'minor' })).toEqual([9, 11, 0, 2, 4, 5, 7]);
  });

  it('sabe si una nota pertenece a la tonalidad', () => {
    const cMajor = { tonic: 'C', mode: 'major' } as const;
    expect(isDiatonicPitch(64, cMajor)).toBe(true);
    expect(isDiatonicPitch(66, cMajor)).toBe(false);
  });

  it('lista las tríadas diatónicas', () => {
    expect(diatonicTriads({ tonic: 'C', mode: 'major' })).toEqual([
      'C',
      'Dm',
      'Em',
      'F',
      'G',
      'Am',
      'Bdim',
    ]);
  });

  it('en menor incluye la dominante mayor de la escala armónica', () => {
    const triads = diatonicTriads({ tonic: 'A', mode: 'minor' });
    expect(triads).toContain('Em');
    expect(triads).toContain('E');
    expect(new Set(triads).size).toBe(triads.length);
  });

  it('nombra la tonalidad en español', () => {
    expect(keyDisplayName({ tonic: 'C', mode: 'major' })).toBe('Do mayor');
    expect(keyDisplayName({ tonic: 'Bb', mode: 'minor' })).toBe('Si bemol menor');
    expect(keyDisplayName({ tonic: 'F#', mode: 'major' })).toBe('Fa sostenido mayor');
  });
});
