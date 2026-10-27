import { Note, Song } from '../../domain/model/song';
import { insertNotes, removeNotesById, replaceNotes } from '../../domain/model/song-edits';
import { SongCommand } from './song-command';

export class AddNotesCommand implements SongCommand {
  readonly label: string;

  constructor(private readonly notes: readonly Note[]) {
    this.label = notes.length === 1 ? 'Agregar nota' : 'Agregar notas';
  }

  apply(song: Song): Song {
    return insertNotes(song, this.notes);
  }

  revert(song: Song): Song {
    return removeNotesById(
      song,
      this.notes.map((note) => note.id),
    );
  }
}

export class RemoveNotesCommand implements SongCommand {
  readonly label: string;

  /** Recibe las notas completas para poder restaurarlas al deshacer. */
  constructor(private readonly notes: readonly Note[]) {
    this.label = notes.length === 1 ? 'Borrar nota' : 'Borrar notas';
  }

  apply(song: Song): Song {
    return removeNotesById(
      song,
      this.notes.map((note) => note.id),
    );
  }

  revert(song: Song): Song {
    return insertNotes(song, this.notes);
  }
}

/** Cambia altura, inicio o duración de una o varias notas (mover y estirar). */
export class UpdateNotesCommand implements SongCommand {
  constructor(
    readonly label: string,
    private readonly before: readonly Note[],
    private readonly after: readonly Note[],
  ) {}

  apply(song: Song): Song {
    return replaceNotes(song, this.after);
  }

  revert(song: Song): Song {
    return replaceNotes(song, this.before);
  }
}
