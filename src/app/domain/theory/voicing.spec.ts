import { chordVoicing } from './voicing';

describe('chordVoicing', () => {
  it('pone la fundamental en la octava 3 y apila hacia arriba', () => {
    expect(chordVoicing('C')).toEqual([48, 52, 55]);
    expect(chordVoicing('Am')).toEqual([57, 60, 64]);
    expect(chordVoicing('G7')).toEqual([55, 59, 62, 65]);
  });

  it('devuelve null con un símbolo desconocido', () => {
    expect(chordVoicing('Hmaj')).toBeNull();
  });
});
