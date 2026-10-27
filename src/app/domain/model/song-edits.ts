import { Note, Song } from './song';

/**
 * Transformaciones puras de la canción. Nunca modifican la canción recibida: devuelven una
 * nueva. Las notas se mantienen ordenadas por inicio y altura.
 */

function byStartThenPitch(a: Note, b: Note): number {
  return a.start - b.start || a.pitch - b.pitch;
}

export function insertNotes(song: Song, notes: readonly Note[]): Song {
  return { ...song, notes: [...song.notes, ...notes].sort(byStartThenPitch) };
}

export function removeNotesById(song: Song, ids: readonly string[]): Song {
  const toRemove = new Set(ids);
  return { ...song, notes: song.notes.filter((note) => !toRemove.has(note.id)) };
}

/** Reemplaza las notas con el mismo id. Las que no existen se ignoran. */
export function replaceNotes(song: Song, notes: readonly Note[]): Song {
  const replacements = new Map(notes.map((note) => [note.id, note]));
  return {
    ...song,
    notes: song.notes.map((note) => replacements.get(note.id) ?? note).sort(byStartThenPitch),
  };
}

/** Desplaza las notas en el tiempo y en altura. No valida límites: eso lo decide quien llama. */
export function shiftNotes(notes: readonly Note[], deltaTicks: number, deltaPitch: number): Note[] {
  return notes.map((note) => ({
    ...note,
    start: note.start + deltaTicks,
    pitch: note.pitch + deltaPitch,
  }));
}

/** Desde el inicio más temprano hasta el final más tardío de un grupo de notas. */
export function notesSpan(notes: readonly Note[]): { start: number; end: number } | null {
  if (notes.length === 0) {
    return null;
  }
  return {
    start: Math.min(...notes.map((note) => note.start)),
    end: Math.max(...notes.map((note) => note.start + note.duration)),
  };
}

export function findNotes(song: Song, ids: readonly string[]): Note[] {
  const wanted = new Set(ids);
  return song.notes.filter((note) => wanted.has(note.id));
}
