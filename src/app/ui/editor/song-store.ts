import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ReplaceMeasureChordsCommand } from '../../application/commands/chord-commands';
import {
  AddNotesCommand,
  RemoveNotesCommand,
  UpdateNotesCommand,
} from '../../application/commands/note-commands';
import { createDemoSong } from '../../application/samples/demo-song';
import { SongEditor } from '../../application/use-cases/song-editor';
import { Note, Song } from '../../domain/model/song';
import { findNotes } from '../../domain/model/song-edits';
import { measureIndexAt, Ticks } from '../../domain/model/time';
import { parseMeasureChords } from '../../domain/services/chord-line';
import { ID_GENERATOR } from '../ports.tokens';

const DEFAULT_VELOCITY = 96;

export type NoteDraft = Omit<Note, 'id'>;

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
    const [id] = this.addNotes([{ pitch, start, duration, velocity: DEFAULT_VELOCITY }]);
    return id;
  }

  /** Crea varias notas en un solo paso de deshacer y devuelve sus ids. */
  addNotes(drafts: readonly NoteDraft[]): string[] {
    if (drafts.length === 0) return [];
    const notes: Note[] = drafts.map((draft) => ({ ...draft, id: this.ids.next() }));
    this.editor.execute(new AddNotesCommand(notes));
    return notes.map((note) => note.id);
  }

  /** Aplica la versión final de una nota tras moverla o estirarla. */
  updateNote(label: string, after: Note): void {
    this.updateNotes(label, [after]);
  }

  /** Aplica la versión final de varias notas en un solo paso de deshacer. */
  updateNotes(label: string, after: readonly Note[]): void {
    const before = findNotes(
      this.editor.song,
      after.map((note) => note.id),
    );
    if (before.length > 0) {
      this.editor.execute(new UpdateNotesCommand(label, before, after));
    }
  }

  removeNotes(ids: readonly string[]): void {
    const notes = findNotes(this.editor.song, ids);
    if (notes.length > 0) {
      this.editor.execute(new RemoveNotesCommand(notes));
    }
  }

  /**
   * Reemplaza los acordes de un compás con lo escrito. Si hay símbolos desconocidos no cambia
   * nada y los devuelve, para que la interfaz los marque.
   */
  setMeasureChords(measureIndex: number, text: string): string[] {
    const song = this.editor.song;
    const parsed = parseMeasureChords(text, measureIndex, song.timeSignature, () =>
      this.ids.next(),
    );
    if (parsed.invalidSymbols.length > 0) {
      return parsed.invalidSymbols;
    }
    const before = song.chords.filter(
      (chord) => measureIndexAt(chord.start, song.timeSignature) === measureIndex,
    );
    const unchanged =
      before.map((c) => c.symbol).join(' ') === parsed.chords.map((c) => c.symbol).join(' ');
    if (!unchanged) {
      this.editor.execute(new ReplaceMeasureChordsCommand(measureIndex, before, parsed.chords));
    }
    return [];
  }

  undo(): void {
    this.editor.undo();
  }

  redo(): void {
    this.editor.redo();
  }
}
