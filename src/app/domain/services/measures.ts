import { noteEnd } from '../model/note-validation';
import { Note, Song } from '../model/song';
import { measureIndexAt, measureStart, Ticks, ticksPerMeasure } from '../model/time';

/** Fragmento de una nota dentro de un compás. tiedToNext indica que sigue en el compás siguiente. */
export interface MeasureSlice {
  readonly noteId: string;
  readonly pitch: number;
  readonly start: Ticks;
  readonly duration: Ticks;
  readonly tiedFromPrevious: boolean;
  readonly tiedToNext: boolean;
}

/** Cantidad de compases que ocupa la canción, contando secciones y notas. */
export function songLengthInMeasures(song: Song): number {
  const fromSections = song.sections.reduce(
    (max, s) => Math.max(max, s.startMeasure + s.measureCount),
    0,
  );
  const lastTick = Math.max(0, ...song.notes.map(noteEnd), ...song.chords.map(noteEnd));
  const fromEvents = Math.ceil(lastTick / ticksPerMeasure(song.timeSignature));
  return Math.max(fromSections, fromEvents);
}

/**
 * Parte una nota en la barra de compás. Es la base de las ligaduras en la partitura.
 */
export function splitNoteAtBarlines(note: Note, song: Pick<Song, 'timeSignature'>): MeasureSlice[] {
  const slices: MeasureSlice[] = [];
  const end = noteEnd(note);
  let cursor = note.start;
  while (cursor < end) {
    const nextBar = measureStart(
      measureIndexAt(cursor, song.timeSignature) + 1,
      song.timeSignature,
    );
    const sliceEnd = Math.min(end, nextBar);
    slices.push({
      noteId: note.id,
      pitch: note.pitch,
      start: cursor,
      duration: sliceEnd - cursor,
      tiedFromPrevious: cursor > note.start,
      tiedToNext: sliceEnd < end,
    });
    cursor = sliceEnd;
  }
  return slices;
}

/** Fragmentos de todas las notas que suenan dentro del compás indicado, ordenados por inicio. */
export function notesInMeasure(song: Song, measureIndex: number): MeasureSlice[] {
  return song.notes
    .flatMap((note) => splitNoteAtBarlines(note, song))
    .filter((slice) => measureIndexAt(slice.start, song.timeSignature) === measureIndex)
    .sort((a, b) => a.start - b.start || a.pitch - b.pitch);
}
