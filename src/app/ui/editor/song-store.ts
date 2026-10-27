import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  AddNotesCommand,
  RemoveNotesCommand,
  UpdateNotesCommand,
} from '../../application/commands/note-commands';
import { createDemoSong } from '../../application/samples/demo-song';
import { SongEditor } from '../../application/use-cases/song-editor';
import { Note, Song } from '../../domain/model/song';
import { findNotes } from '../../domain/model/song-edits';
import { Ticks } from '../../domain/model/time';
import { ID_GENERATOR } from '../ports.tokens';

const DEFAULT_VELOCITY = 96;

/**
 * Estado del editor para la interfaz. Expone la canción como signals y traduce las acciones
 * del usuario en comandos del caso de uso SongEditor.
 */
@Injectable()
export class SongStore {
  private readonly ids = inject(ID_GENERATOR);
  private readonly editor = new SongEditor(createDemoSong(() => this.ids.next()));

  private readonly songState = signal<Song>(this.editor.song);
  private readonly historyState = signal({
    canUndo: false,
    canRedo: false,
    undoLabel: null as string | null,
    redoLabel: null as string | null,
  });

  readonly song = this.songState.asReadonly();
  readonly history = this.historyState.asReadonly();

  constructor() {
    const unsubscribe = this.editor.subscribe((song) => {
      this.songState.set(song);
      this.historyState.set({
        canUndo: this.editor.canUndo(),
        canRedo: this.editor.canRedo(),
        undoLabel: this.editor.undoLabel(),
        redoLabel: this.editor.redoLabel(),
      });
    });
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  /** Crea una nota y devuelve su id. */
  addNote(pitch: number, start: Ticks, duration: Ticks): string {
    const note: Note = { id: this.ids.next(), pitch, start, duration, velocity: DEFAULT_VELOCITY };
    this.editor.execute(new AddNotesCommand([note]));
    return note.id;
  }

  /** Aplica la versión final de una nota tras moverla o estirarla. */
  updateNote(label: string, after: Note): void {
    const [before] = findNotes(this.editor.song, [after.id]);
    if (before) {
      this.editor.execute(new UpdateNotesCommand(label, [before], [after]));
    }
  }

  removeNotes(ids: readonly string[]): void {
    const notes = findNotes(this.editor.song, ids);
    if (notes.length > 0) {
      this.editor.execute(new RemoveNotesCommand(notes));
    }
  }

  undo(): void {
    this.editor.undo();
  }

  redo(): void {
    this.editor.redo();
  }
}
