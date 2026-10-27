import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Note } from '../../domain/model/song';
import { measureStart, Ticks } from '../../domain/model/time';
import { songLengthInMeasures } from '../../domain/services/measures';
import { pitchName } from '../../domain/theory/pitch';
import { SongStore } from '../editor/song-store';
import { DragState, draggedNote, hasChanged } from './note-drag';
import {
  gridHeight,
  gridLines,
  gridWidth,
  hitTest,
  isBlackKey,
  noteRect,
  PianoRollLayout,
  pitchToY,
  snapDown,
  tickToX,
  visiblePitches,
  xToTick,
  yToPitch,
} from './piano-roll-geometry';

const PREVIEW_ID = '__preview__';
const MIN_MEASURES = 8;
const EXTRA_MEASURES = 2;
/** Mi5: al abrir, la vista se centra en el registro habitual de una melodía. */
const INITIAL_SCROLL_PITCH = 76;
const BASE_LAYOUT = { lowestPitch: 36, highestPitch: 96, rowHeight: 14, pixelsPerQuarter: 64 };

/** Editor de notas: clic para crear, arrastrar para mover o estirar, clic derecho para borrar. */
@Component({
  selector: 'app-piano-roll',
  templateUrl: './piano-roll.html',
  styleUrl: './piano-roll.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    role: 'application',
    'aria-label': 'Piano roll. Supr borra la nota seleccionada; Ctrl+Z deshace; Ctrl+Y rehace.',
    '(keydown)': 'onKeydown($event)',
  },
})
export class PianoRoll {
  readonly grid = input<Ticks>(240);

  private readonly store = inject(SongStore);
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  protected readonly selectedId = signal<string | null>(null);
  private readonly drag = signal<DragState | null>(null);
  private readonly preview = signal<Note | null>(null);
  protected readonly overResizeHandle = signal(false);

  protected readonly layout = computed<PianoRollLayout>(() => {
    const song = this.store.song();
    const measures = Math.max(MIN_MEASURES, songLengthInMeasures(song) + EXTRA_MEASURES);
    return { ...BASE_LAYOUT, measures, signature: song.timeSignature };
  });
  protected readonly width = computed(() => gridWidth(this.layout()));
  protected readonly height = computed(() => gridHeight(this.layout()));
  protected readonly pitches = computed(() => visiblePitches(this.layout()));
  protected readonly lines = computed(() => gridLines(this.layout(), this.grid()));
  protected readonly measureLabels = computed(() =>
    Array.from({ length: this.layout().measures }, (_, i) => ({
      number: i + 1,
      x: tickToX(measureStart(i, this.layout().signature), this.layout()),
    })),
  );
  protected readonly notes = computed(() => {
    const preview = this.preview();
    const notes = this.store.song().notes.map((n) => (n.id === preview?.id ? preview : n));
    const all = preview?.id === PREVIEW_ID ? [...notes, preview] : notes;
    return all.map((note) => ({
      id: note.id,
      rect: noteRect(note, this.layout()),
      selected: note.id === this.selectedId() || note.id === PREVIEW_ID,
      label: pitchName(note.pitch),
    }));
  });

  constructor() {
    afterNextRender(() => {
      const element = this.scroller()?.nativeElement;
      if (element) {
        element.scrollTop = pitchToY(INITIAL_SCROLL_PITCH, this.layout());
      }
    });
  }

  protected rowY(pitch: number): number {
    return pitchToY(pitch, this.layout());
  }

  protected isBlack(pitch: number): boolean {
    return isBlackKey(pitch);
  }

  protected keyLabel(pitch: number): string {
    return pitch % 12 === 0 ? pitchName(pitch) : '';
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const { x, y } = this.localPoint(event);
    const layout = this.layout();
    const hit = hitTest(this.store.song().notes, x, y, layout);
    const pointerTick = xToTick(x, layout);
    const pointerPitch = yToPitch(y, layout);
    if (hit) {
      this.selectedId.set(hit.note.id);
      this.drag.set({
        mode: hit.zone === 'resize' ? 'resize' : 'move',
        original: hit.note,
        pointerTick,
        pointerPitch,
      });
    } else {
      const grid = this.grid();
      const note: Note = {
        id: PREVIEW_ID,
        pitch: pointerPitch,
        start: snapDown(pointerTick, grid),
        duration: grid,
        velocity: 96,
      };
      this.selectedId.set(null);
      this.drag.set({ mode: 'create', original: note, pointerTick, pointerPitch });
      this.preview.set(note);
    }
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag();
    const { x, y } = this.localPoint(event);
    const layout = this.layout();
    if (!drag) {
      const hit = hitTest(this.store.song().notes, x, y, layout);
      this.overResizeHandle.set(hit?.zone === 'resize');
      return;
    }
    this.preview.set(
      draggedNote(drag, xToTick(x, layout), yToPitch(y, layout), this.grid(), layout),
    );
  }

  protected onPointerUp(): void {
    const drag = this.drag();
    if (!drag) return;
    const final = this.preview() ?? drag.original;
    this.cancelDrag();
    if (drag.mode === 'create') {
      this.selectedId.set(this.store.addNote(final.pitch, final.start, final.duration));
    } else if (hasChanged(drag.original, final)) {
      this.store.updateNote(drag.mode === 'move' ? 'Mover nota' : 'Estirar nota', final);
    }
  }

  protected cancelDrag(): void {
    this.drag.set(null);
    this.preview.set(null);
  }

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const { x, y } = this.localPoint(event);
    const hit = hitTest(this.store.song().notes, x, y, this.layout());
    if (hit) {
      this.deleteNote(hit.note.id);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    const selected = this.selectedId();
    if (mod && key === 'z' && !event.shiftKey) {
      this.store.undo();
    } else if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) {
      this.store.redo();
    } else if ((key === 'delete' || key === 'backspace') && selected) {
      this.deleteNote(selected);
    } else {
      return;
    }
    event.preventDefault();
  }

  private deleteNote(id: string): void {
    this.store.removeNotes([id]);
    if (this.selectedId() === id) {
      this.selectedId.set(null);
    }
  }

  private localPoint(event: MouseEvent): { x: number; y: number } {
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
}
