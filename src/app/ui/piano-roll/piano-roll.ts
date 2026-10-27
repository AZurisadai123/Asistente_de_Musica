import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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
import { PlaybackSession } from '../editor/playback-session';
import { SongStore } from '../editor/song-store';
import { DragState, draggedNote, hasChanged } from './note-drag';
import * as geo from './piano-roll-geometry';

const PREVIEW_ID = '__preview__';
const MIN_MEASURES = 8;
const EXTRA_MEASURES = 2;
const KEYBOARD_HEIGHT = 72;
/** Sol3: al abrir, la vista horizontal empieza cerca del registro de una melodía. */
const INITIAL_LEFT_PITCH = 55;
const BASE_LAYOUT = { lowestPitch: 36, highestPitch: 96, columnWidth: 14, pixelsPerQuarter: 48 };

/**
 * Piano roll vertical con el teclado abajo: las notas caen hacia las teclas. Clic para crear,
 * arrastrar para mover, arrastrar el borde superior para estirar, clic derecho para borrar.
 */
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
  protected readonly session = inject(PlaybackSession);
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  protected readonly selectedId = signal<string | null>(null);
  private readonly drag = signal<DragState | null>(null);
  private readonly preview = signal<Note | null>(null);
  protected readonly overResizeHandle = signal(false);
  protected readonly keyboardHeight = KEYBOARD_HEIGHT;

  protected readonly layout = computed<geo.PianoRollLayout>(() => {
    const song = this.store.song();
    const measures = Math.max(MIN_MEASURES, songLengthInMeasures(song) + EXTRA_MEASURES);
    return { ...BASE_LAYOUT, measures, signature: song.timeSignature };
  });
  protected readonly width = computed(() => geo.gridWidth(this.layout()));
  protected readonly height = computed(() => geo.gridHeight(this.layout()));
  protected readonly pitches = computed(() => geo.visiblePitches(this.layout()));
  protected readonly lines = computed(() => geo.gridLines(this.layout(), this.grid()));
  protected readonly measureLabels = computed(() =>
    Array.from({ length: this.layout().measures }, (_, i) => ({
      number: i + 1,
      y: geo.tickToY(measureStart(i, this.layout().signature), this.layout()),
    })),
  );
  protected readonly notes = computed(() => {
    const preview = this.preview();
    const notes = this.store.song().notes.map((n) => (n.id === preview?.id ? preview : n));
    const all = preview?.id === PREVIEW_ID ? [...notes, preview] : notes;
    return all.map((note) => ({
      id: note.id,
      rect: geo.noteRect(note, this.layout()),
      selected: note.id === this.selectedId() || note.id === PREVIEW_ID,
      label: pitchName(note.pitch),
    }));
  });
  protected readonly keys = computed(() => {
    const layout = this.layout();
    const all = this.pitches().map((pitch) => ({
      pitch,
      black: geo.isBlackKey(pitch),
      rect: geo.isBlackKey(pitch)
        ? geo.blackKeyRect(pitch, layout, KEYBOARD_HEIGHT)
        : geo.whiteKeyRect(pitch, layout, KEYBOARD_HEIGHT),
      label: pitch % 12 === 0 ? pitchName(pitch) : '',
    }));
    // Las negras se dibujan después para quedar encima de las blancas.
    return [...all.filter((k) => !k.black), ...all.filter((k) => k.black)];
  });
  protected readonly playheadY = computed(() => geo.tickToY(this.session.tick(), this.layout()));
  /** Alturas que suenan en la posición actual: sus teclas se iluminan. */
  protected readonly activePitches = computed(() => {
    if (!this.session.playing()) return new Set<number>();
    const tick = this.session.tick();
    const sounding = this.store
      .song()
      .notes.filter((n) => n.start <= tick && tick < n.start + n.duration);
    return new Set(sounding.map((n) => n.pitch));
  });

  constructor() {
    afterNextRender(() => {
      const element = this.scroller()?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
        element.scrollLeft = geo.pitchToX(INITIAL_LEFT_PITCH, this.layout());
      }
    });
    // Mientras suena, la vista baja para que la posición actual quede junto al teclado.
    effect(() => {
      const y = this.playheadY();
      const element = this.scroller()?.nativeElement;
      if (this.session.playing() && element) {
        element.scrollTop = y - (element.clientHeight - KEYBOARD_HEIGHT);
      }
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const { x, y } = this.localPoint(event);
    const layout = this.layout();
    const hit = geo.hitTest(this.store.song().notes, x, y, layout);
    const pointerTick = geo.yToTick(y, layout);
    const pointerPitch = geo.xToPitch(x, layout);
    if (hit) {
      const mode = hit.zone === 'resize' ? 'resize' : 'move';
      this.selectedId.set(hit.note.id);
      this.drag.set({ mode, original: hit.note, pointerTick, pointerPitch });
    } else {
      const grid = this.grid();
      const start = geo.snapDown(pointerTick, grid);
      const note: Note = {
        id: PREVIEW_ID,
        pitch: pointerPitch,
        start,
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
      const hit = geo.hitTest(this.store.song().notes, x, y, layout);
      this.overResizeHandle.set(hit?.zone === 'resize');
      return;
    }
    const tick = geo.yToTick(y, layout);
    this.preview.set(draggedNote(drag, tick, geo.xToPitch(x, layout), this.grid(), layout));
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
    const hit = geo.hitTest(this.store.song().notes, x, y, this.layout());
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
