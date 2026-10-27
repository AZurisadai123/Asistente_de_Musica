import { Song } from '../../domain/model/song';
import { SongCommand } from './song-command';

const DEFAULT_LIMIT = 200;

/** Pilas de deshacer y rehacer. Ejecutar un comando nuevo vacía la pila de rehacer. */
export class CommandHistory {
  private readonly done: SongCommand[] = [];
  private readonly undone: SongCommand[] = [];

  constructor(private readonly limit = DEFAULT_LIMIT) {}

  execute(command: SongCommand, song: Song): Song {
    const next = command.apply(song);
    this.done.push(command);
    if (this.done.length > this.limit) {
      this.done.shift();
    }
    this.undone.length = 0;
    return next;
  }

  /** Devuelve la canción sin el último comando, o null si no hay nada que deshacer. */
  undo(song: Song): Song | null {
    const command = this.done.pop();
    if (!command) {
      return null;
    }
    this.undone.push(command);
    return command.revert(song);
  }

  redo(song: Song): Song | null {
    const command = this.undone.pop();
    if (!command) {
      return null;
    }
    this.done.push(command);
    return command.apply(song);
  }

  canUndo(): boolean {
    return this.done.length > 0;
  }

  canRedo(): boolean {
    return this.undone.length > 0;
  }

  /** Texto del comando que se desharía, para mostrarlo en la interfaz. */
  undoLabel(): string | null {
    return this.done.at(-1)?.label ?? null;
  }

  redoLabel(): string | null {
    return this.undone.at(-1)?.label ?? null;
  }

  clear(): void {
    this.done.length = 0;
    this.undone.length = 0;
  }
}
