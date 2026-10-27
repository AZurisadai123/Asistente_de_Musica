import { validateNote } from '../../domain/model/note-validation';
import { songLengthInMeasures } from '../../domain/services/measures';
import { createDemoSong } from './demo-song';

describe('createDemoSong', () => {
  let n = 0;
  const song = createDemoSong(() => `id${++n}`);

  it('tiene 4 compases con un acorde cada uno', () => {
    expect(songLengthInMeasures(song)).toBe(4);
    expect(song.chords.map((c) => c.symbol)).toEqual(['C', 'Am', 'F', 'G']);
  });

  it('solo contiene notas válidas', () => {
    expect(song.notes.flatMap(validateNote)).toEqual([]);
  });

  it('usa ids únicos', () => {
    const ids = [song.id, ...song.notes.map((x) => x.id), ...song.chords.map((x) => x.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
