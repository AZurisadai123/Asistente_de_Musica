import { inject, Injectable, signal } from '@angular/core';
import { Note } from '../../domain/model/song';
import { findNotes, notesSpan, shiftNotes } from '../../domain/model/song-edits';
import { Ticks } from '../../domain/model/time';
import { EditorAction } from '../piano-roll/keyboard-shortcuts';
import { limitShift } from '../piano-roll/note-drag';
import { PIANO_ROLL_PITCH_RANGE } from '../piano-roll/piano-roll-geometry';
import { PlaybackSession } from './playback-session';
import { NoteDraft, SongStore } from './song-store';

interface Clipboard {
  readonly notes: readonly Note[];
  /** Dónde cae el próximo pegado: justo después del anterior. */
  nextStart: Ticks;
}

function toDraft(note: Note): NoteDraft {
  return { pitch: note.pitch, start: note.start, duration: note.duration, velocity: note.velocity };
}

/** Selección de notas y acciones sobre ella: borrar, mover, copiar, pegar y duplicar. */
@Injectable()
export class EditorActions {
  private readonly store = inject(SongStore);
  private readonly session = inject(PlaybackSession);
  private readonly selectedState = signal<ReadonlySet<string>>(new Set());
  private clipboard: Clipboard | null = null;

  readonly selected = this.selectedState.asReadonly();

  isSelected(id: string): boolean {
    return this.selectedState().has(id);
  }

  select(ids: Iterable<string>): void {
    this.selectedState.set(new Set(ids));
  }

  toggle(id: string): void {
    const next = new Set(this.selectedState());
    if (!next.delete(id)) next.add(id);
    this.selectedState.set(next);
  }

  clear(): void {
    this.selectedState.set(new Set());
  }

  selectedNotes(): Note[] {
    return findNotes(this.store.song(), [...this.selectedState()]);
  }

  run(action: EditorAction, grid: Ticks): void {
    switch (action.type) {
      case 'undo':
        return this.store.undo();
      case 'redo':
        return this.store.redo();
      case 'delete':
        return this.deleteSelected();
      case 'selectAll':
        return this.select(this.store.song().notes.map((note) => note.id));
      case 'clearSelection':
        return this.clear();
      case 'copy':
        return this.copy();
      case 'paste':
        return this.paste();
      case 'duplicate':
        return this.duplicate();
      case 'move':
        return this.moveSelected(action.gridSteps * grid, action.semitones);
    }
  }

  deleteSelected(): void {
    this.store.removeNotes([...this.selectedState()]);
    this.clear();
  }

  copy(): void {
    const notes = this.selectedNotes();
    const span = notesSpan(notes);
    this.clipboard = span ? { notes, nextStart: span.end } : null;
  }

  /** Pega lo copiado después del último pegado y selecciona lo pegado. */
  paste(): void {
    const clipboard = this.clipboard;
    const span = clipboard && notesSpan(clipboard.notes);
    if (!clipboard || !span) return;
    const shifted = shiftNotes(clipboard.notes, clipboard.nextStart - span.start, 0);
    clipboard.nextStart += span.end - span.start;
    this.select(this.store.addNotes(shifted.map(toDraft)));
  }

  /** Copia la selección justo a continuación de sí misma. */
  duplicate(): void {
    const notes = this.selectedNotes();
    const span = notesSpan(notes);
    if (!span) return;
    const shifted = shiftNotes(notes, span.end - span.start, 0);
    this.select(this.store.addNotes(shifted.map(toDraft)));
  }

  moveSelected(deltaTicks: Ticks, deltaPitch: number): void {
    const notes = this.selectedNotes();
    const limited = limitShift(notes, deltaTicks, deltaPitch, PIANO_ROLL_PITCH_RANGE);
    if (limited.deltaTicks === 0 && limited.deltaPitch === 0) return;
    const moved = shiftNotes(notes, limited.deltaTicks, limited.deltaPitch);
    this.store.updateNotes(moved.length === 1 ? 'Mover nota' : 'Mover notas', moved);
    if (limited.deltaPitch !== 0) {
      this.session.previewPitch(moved[0].pitch);
    }
  }
}
