import { Song } from '../../domain/model/song';
import { createEmptySong } from '../../domain/model/song-factory';
import { ReplaceMeasureChordsCommand } from './chord-commands';

const chord = (id: string, symbol: string, start: number) => ({
  id,
  symbol,
  start,
  duration: 1920,
});

describe('ReplaceMeasureChordsCommand', () => {
  const base: Song = {
    ...createEmptySong('s'),
    chords: [chord('a', 'C', 0), chord('b', 'F', 1920)],
  };

  it('reemplaza solo el compás indicado y deshacer lo restaura', () => {
    const before = [chord('b', 'F', 1920)];
    const command = new ReplaceMeasureChordsCommand(1, before, [chord('c', 'G7', 1920)]);
    const after = command.apply(base);
    expect(after.chords.map((c) => c.symbol)).toEqual(['C', 'G7']);
    expect(command.revert(after)).toEqual(base);
    expect(command.label).toBe('Cambiar acordes');
  });
});
