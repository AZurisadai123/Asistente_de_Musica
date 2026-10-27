import { Note } from './song';
import { findNotes, insertNotes, removeNotesById, replaceNotes } from './song-edits';
import { createEmptySong } from './song-factory';

const n = (id: string, start: number, pitch = 60): Note => ({
  id,
  pitch,
  start,
  duration: 480,
  velocity: 90,
});

describe('song-edits', () => {
  const base = { ...createEmptySong('s'), notes: [n('a', 0), n('b', 960)] };

  it('inserta notas manteniendo el orden por inicio y altura', () => {
    const song = insertNotes(base, [n('c', 480), n('d', 0, 55)]);
    expect(song.notes.map((x) => x.id)).toEqual(['d', 'a', 'c', 'b']);
  });

  it('no modifica la canción original', () => {
    insertNotes(base, [n('c', 480)]);
    removeNotesById(base, ['a']);
    expect(base.notes.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('borra por id', () => {
    expect(removeNotesById(base, ['a', 'zzz']).notes.map((x) => x.id)).toEqual(['b']);
  });

  it('reemplaza por id y reordena', () => {
    const song = replaceNotes(base, [{ ...n('a', 1440), pitch: 67 }]);
    expect(song.notes.map((x) => [x.id, x.start, x.pitch])).toEqual([
      ['b', 960, 60],
      ['a', 1440, 67],
    ]);
  });

  it('busca notas por id', () => {
    expect(findNotes(base, ['b']).map((x) => x.id)).toEqual(['b']);
  });
});
