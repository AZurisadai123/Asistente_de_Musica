import { Song } from '../../domain/model/song';
import { CommandHistory } from '../commands/command-history';
import { SongCommand } from '../commands/song-command';

export type SongListener = (song: Song) => void;

/**
 * Caso de uso de edición: guarda la canción actual y aplica comandos con deshacer y rehacer.
 * Avisa a los suscriptores en cada cambio; no depende de Angular ni de RxJS.
 */
export class SongEditor {
  private current: Song;
  private readonly listeners = new Set<SongListener>();

  constructor(
    initial: Song,
    private readonly history = new CommandHistory(),
  ) {
    this.current = initial;
  }

  get song(): Song {
    return this.current;
  }

  execute(command: SongCommand): void {
    this.set(this.history.execute(command, this.current));
  }

  undo(): boolean {
    return this.applyIfChanged(this.history.undo(this.current));
  }

  redo(): boolean {
    return this.applyIfChanged(this.history.redo(this.current));
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  undoLabel(): string | null {
    return this.history.undoLabel();
  }

  redoLabel(): string | null {
    return this.history.redoLabel();
  }

  /** Carga otra canción y borra el historial (abrir archivo, canción nueva). */
  load(song: Song): void {
    this.history.clear();
    this.set(song);
  }

  subscribe(listener: SongListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private applyIfChanged(song: Song | null): boolean {
    if (!song) {
      return false;
    }
    this.set(song);
    return true;
  }

  private set(song: Song): void {
    this.current = song;
    this.listeners.forEach((listener) => listener(song));
  }
}
