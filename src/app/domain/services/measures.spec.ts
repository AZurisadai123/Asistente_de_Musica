import { createEmptySong } from '../model/song-factory';
import { Note, Song } from '../model/song';
import { notesInMeasure, songLengthInMeasures, splitNoteAtBarlines } from './measures';

function note(id: string, start: number, duration: number, pitch = 60): Note {
  return { id, pitch, start, duration, velocity: 90 };
}

function songWith(notes: Note[]): Song {
  return { ...createEmptySong('s1'), notes };
}

describe('splitNoteAtBarlines', () => {
  it('no parte una nota que cabe en su compás', () => {
    const slices = splitNoteAtBarlines(note('a', 480, 960), songWith([]));
    expect(slices).toHaveLength(1);
    expect(slices[0]).toMatchObject({ tiedFromPrevious: false, tiedToNext: false });
  });

  it('parte y liga una nota que cruza la barra', () => {
    // Blanca que empieza en el cuarto tiempo del compás 0.
    const slices = splitNoteAtBarlines(note('a', 1440, 960), songWith([]));
    expect(slices).toEqual([
      {
        noteId: 'a',
        pitch: 60,
        start: 1440,
        duration: 480,
        tiedFromPrevious: false,
        tiedToNext: true,
      },
      {
        noteId: 'a',
        pitch: 60,
        start: 1920,
        duration: 480,
        tiedFromPrevious: true,
        tiedToNext: false,
      },
    ]);
  });

  it('conserva la duración total al partir en varios compases', () => {
    const slices = splitNoteAtBarlines(note('a', 960, 1920 * 2), songWith([]));
    expect(slices).toHaveLength(3);
    expect(slices.reduce((sum, s) => sum + s.duration, 0)).toBe(1920 * 2);
  });
});

describe('notesInMeasure', () => {
  it('incluye el fragmento ligado que entra desde el compás anterior', () => {
    const song = songWith([note('a', 1440, 960), note('b', 2400, 480, 64)]);
    const measure1 = notesInMeasure(song, 1);
    expect(measure1.map((s) => s.noteId)).toEqual(['a', 'b']);
    expect(measure1[0].tiedFromPrevious).toBe(true);
  });
});

describe('songLengthInMeasures', () => {
  it('es 0 para una canción vacía', () => {
    expect(songLengthInMeasures(createEmptySong('s1'))).toBe(0);
  });

  it('toma el mayor entre secciones y notas', () => {
    const song: Song = {
      ...songWith([note('a', 1920 * 4, 480)]),
      sections: [{ id: 'v', type: 'verse', name: 'Estrofa', startMeasure: 0, measureCount: 8 }],
    };
    expect(songLengthInMeasures(song)).toBe(8);
    expect(songLengthInMeasures({ ...song, sections: [] })).toBe(5);
  });
});
