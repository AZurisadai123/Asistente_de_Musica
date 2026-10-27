import { createEmptySong } from '../model/song-factory';
import { COMMON_TIME } from '../model/time';
import { formatMeasureChords, parseMeasureChords, replaceMeasureChords } from './chord-line';

function idSequence(): () => string {
  let n = 0;
  return () => `c${++n}`;
}

describe('parseMeasureChords', () => {
  it('un acorde ocupa el compás completo', () => {
    const { chords } = parseMeasureChords('Am', 1, COMMON_TIME, idSequence());
    expect(chords).toEqual([{ id: 'c1', symbol: 'Am', start: 1920, duration: 1920 }]);
  });

  it('reparte el compás entre varios acordes', () => {
    const { chords } = parseMeasureChords('C, G | Am  F', 0, COMMON_TIME, idSequence());
    expect(chords.map((c) => [c.symbol, c.start, c.duration])).toEqual([
      ['C', 0, 480],
      ['G', 480, 480],
      ['Am', 960, 480],
      ['F', 1440, 480],
    ]);
  });

  it('da el sobrante al último acorde si la división no es exacta', () => {
    // 1920 / 7 no es exacto: seis acordes de 274 ticks y el último de 276.
    const { chords } = parseMeasureChords('C Dm Em F G Am B', 0, COMMON_TIME, idSequence());
    const total = chords.reduce((sum, c) => sum + c.duration, 0);
    expect(total).toBe(1920);
    expect(chords.map((c) => c.duration)).toEqual([274, 274, 274, 274, 274, 274, 276]);
  });

  it('reporta los símbolos desconocidos sin crearlos', () => {
    const result = parseMeasureChords('C Xq G', 0, COMMON_TIME, idSequence());
    expect(result.invalidSymbols).toEqual(['Xq']);
    expect(result.chords.map((c) => c.symbol)).toEqual(['C', 'G']);
  });

  it('un texto vacío no crea acordes', () => {
    expect(parseMeasureChords('   ', 0, COMMON_TIME, idSequence()).chords).toEqual([]);
  });
});

describe('replaceMeasureChords y formatMeasureChords', () => {
  it('reemplaza solo el compás indicado', () => {
    const next = idSequence();
    let song = createEmptySong('s');
    song = replaceMeasureChords(song, 0, parseMeasureChords('C', 0, COMMON_TIME, next).chords);
    song = replaceMeasureChords(song, 1, parseMeasureChords('F G', 1, COMMON_TIME, next).chords);
    song = replaceMeasureChords(song, 0, parseMeasureChords('Am', 0, COMMON_TIME, next).chords);
    expect(formatMeasureChords(song, 0)).toBe('Am');
    expect(formatMeasureChords(song, 1)).toBe('F G');
    expect(song.chords).toHaveLength(3);
  });
});
