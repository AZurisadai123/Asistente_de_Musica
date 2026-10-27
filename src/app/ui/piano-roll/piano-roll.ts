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
import { shiftNotes } from '../../domain/model/song-edits';
import { measureStart, Ticks } from '../../domain/model/time';
import { songLengthInMeasures } from '../../domain/services/measures';
import { pitchName } from '../../domain/theory/pitch';
import { ChordLane } from '../chord-lane/chord-lane';
import { EditorActions } from '../editor/editor-actions';
import { PlaybackSession } from '../editor/playback-session';
import { SongStore } from '../editor/song-store';
import { shortcutFor } from './keyboard-shortcuts';
import { DragState, draggedNote, hasChanged, limitShift } from './note-drag';
import * as geo from './piano-roll-geometry';

const PREVIEW_ID = '__preview__';
const MIN_MEASURES = 8;
const EXTRA_MEASURES = 2;
const KEYBOARD_HEIGHT = 72;
/** Sol3: al abrir, la vista horizontal empieza cerca del registro de una melodía. */
const INITIAL_LEFT_PITCH = 55;
const BASE_LAYOUT = { ...geo.PIANO_ROLL_PITCH_RANGE, columnWidth: 14, pixelsPerQuarter: 48 };

interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Piano roll vertical con el teclado abajo: las notas caen hacia las teclas. Clic para crear,
 * arrastrar para mover (todas las seleccionadas), borde superior para estirar, Mayús+clic o
 * Mayús+arrastrar para seleccionar varias, clic derecho para borrar.
 */
@Component({
  selector: 'app-piano-roll',
  imports: [ChordLane],
  templateUrl: './piano-roll.html',
  styleUrl: './piano-roll.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    role: 'application',
    'aria-label':
      'Piano roll. Flechas mueven la selección; Supr borra; Ctrl+C, Ctrl+V y Ctrl+D copian, pegan y duplican; Ctrl+Z deshace.',
    '(keydown)': 'onKeydown($event)',
  },
})
export class PianoRoll {
  readonly grid = input<Ticks>(240);

  private readonly store = inject(SongStore);
  private readonly actions = inject(EditorActions);
  protected readonly session = inject(PlaybackSession);
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly drag = signal<DragState | null>(null);
  /** Notas que se están arrastrando, en su posición provisional. */
  private readonly preview = signal<ReadonlyMap<string, Note>>(new Map());
  private readonly box = signal<{ from: Point; to: Point } | null>(null);
  private dragGroup: readonly Note[] = [];
  private lastPreviewPitch: number | null = null;
  protected readonly overResizeHandle = signal(false);
  protected readonly keyboardHeight = KEYBOARD_HEIGHT;

  protected readonly layout = computed<geo.PianoRollLayout>(() => {
    const song = this.store.song();
    const measures = Math.max(MIN_MEASURES, songLengthInMeasures(song) + EXTRA_MEASURES);
    return { ...BASE_LAYOUT, measures, signature: song.timeSignature };
  });
  protected readonly width = computed(() => geo.gridWidth(this.layout()));
  protected readonly height = computed(() => geo.gridHeight(this.layout()));
  protected readonly lines = computed(() => geo.gridLines(this.layout(), this.grid()));
  protected readonly keys = computed(() => geo.keyboardKeys(this.layout(), KEYBOARD_HEIGHT));
  protected readonly measureLabels = computed(() =>
    Array.from({ length: this.layout().measures }, (_, i) => ({
      number: i + 1,
      y: geo.tickToY(measureStart(i, this.layout().signature), this.layout()),
    })),
  );
  protected readonly notes = computed(() => {
    const preview = this.preview();
    const selected = this.actions.selected();
    const notes = this.store.song().notes.map((n) => preview.get(n.id) ?? n);
    const created = preview.get(PREVIEW_ID);
    return (created ? [...notes, created] : notes).map((note) => ({
      id: note.id,
      rect: geo.noteRect(note, this.layout()),
      selected: selected.has(note.id) || note.id === PREVIEW_ID,
      label: pitchName(note.pitch),
    }));
  });
  protected readonly boxRect = computed(() => {
    const box = this.box();
    return box ? geo.rectFromPoints(box.from.x, box.from.y, box.to.x, box.to.y) : null;
  });
  protected readonly playheadY = computed(() => geo.tickToY(this.session.tick(), this.layout()));
  /** Alturas que suenan en la posición actual: sus teclas se iluminan. */
  protected readonly activePitches = computed(() => {
    if (!this.session.playing()) return new Set<number>();
    const tick = this.session.tick();
    const notes = this.store.song().notes;
    return new Set(
      notes.filter((n) => n.start <= tick && tick < n.start + n.duration).map((n) => n.pitch),
    );
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

  protected keyLabel(pitch: number): string {
    return pitch % 12 === 0 ? pitchName(pitch) : '';
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const point = this.localPoint(event);
    const hit = geo.hitTest(this.store.song().notes, point.x, point.y, this.layout());
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    if (event.shiftKey) {
      if (hit) this.actions.toggle(hit.note.id);
      else this.box.set({ from: point, to: point });
    } else if (hit) {
      this.startEditing(hit.note, hit.zone === 'resize' ? 'resize' : 'move', point);
    } else {
      this.startCreating(point);
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    const point = this.localPoint(event);
    const layout = this.layout();
    const box = this.box();
    const drag = this.drag();
    if (box) {
      this.box.set({ ...box, to: point });
    } else if (!drag) {
      const hit = geo.hitTest(this.store.song().notes, point.x, point.y, layout);
      this.overResizeHandle.set(hit?.zone === 'resize');
    } else {
      const tick = geo.yToTick(point.y, layout);
      const anchor = draggedNote(drag, tick, geo.xToPitch(point.x, layout), this.grid(), layout);
      const updated = drag.mode === 'move' ? this.moveGroup(drag.original, anchor) : [anchor];
      this.preview.set(new Map(updated.map((note) => [note.id, note])));
      this.auditionIfChanged(anchor.pitch);
    }
  }

  protected onPointerUp(): void {
    const box = this.boxRect();
    const drag = this.drag();
    if (box) {
      const inside = geo.notesInRect(this.store.song().notes, box, this.layout());
      this.actions.select(inside.map((note) => note.id));
    } else if (drag?.mode === 'create') {
      const note = this.preview().get(PREVIEW_ID) ?? drag.original;
      this.actions.select([this.store.addNote(note.pitch, note.start, note.duration)]);
    } else if (drag) {
      const finals = [...this.preview().values()];
      const originals = new Map(this.dragGroup.map((note) => [note.id, note]));
      const changed = finals.some((f) => {
        const original = originals.get(f.id);
        return original !== undefined && hasChanged(original, f);
      });
      if (changed) this.store.updateNotes(this.dragLabel(drag), finals);
    }
    this.cancelDrag();
  }

  protected cancelDrag(): void {
    this.drag.set(null);
    this.box.set(null);
    this.preview.set(new Map());
    this.dragGroup = [];
    this.lastPreviewPitch = null;
  }

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const { x, y } = this.localPoint(event);
    const hit = geo.hitTest(this.store.song().notes, x, y, this.layout());
    if (hit) {
      this.store.removeNotes([hit.note.id]);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Lo que se escribe en las casillas de acordes no son atajos del piano roll.
    if (event.target instanceof HTMLInputElement) return;
    const action = shortcutFor(event);
    if (action) {
      this.actions.run(action, this.grid());
      event.preventDefault();
    }
  }

  private startEditing(note: Note, mode: 'move' | 'resize', point: Point): void {
    if (!this.actions.isSelected(note.id)) this.actions.select([note.id]);
    this.dragGroup = mode === 'move' ? this.actions.selectedNotes() : [note];
    this.beginDrag({ mode, original: note, ...this.pointerPosition(point) });
  }

  private startCreating(point: Point): void {
    const position = this.pointerPosition(point);
    const grid = this.grid();
    const start = geo.snapDown(position.pointerTick, grid);
    const pitch = position.pointerPitch;
    const note: Note = { id: PREVIEW_ID, pitch, start, duration: grid, velocity: 96 };
    this.actions.clear();
    this.beginDrag({ mode: 'create', original: note, ...position });
    this.preview.set(new Map([[PREVIEW_ID, note]]));
  }

  private beginDrag(drag: DragState): void {
    this.drag.set(drag);
    this.auditionIfChanged(drag.original.pitch);
  }

  /** Aplica a todo el grupo el desplazamiento de la nota que se arrastra. */
  private moveGroup(original: Note, anchor: Note): Note[] {
    const deltaTicks = anchor.start - original.start;
    const deltaPitch = anchor.pitch - original.pitch;
    const limited = limitShift(this.dragGroup, deltaTicks, deltaPitch, this.layout());
    return shiftNotes(this.dragGroup, limited.deltaTicks, limited.deltaPitch);
  }

  private auditionIfChanged(pitch: number): void {
    if (pitch !== this.lastPreviewPitch) {
      this.lastPreviewPitch = pitch;
      this.session.previewPitch(pitch);
    }
  }

  private dragLabel(drag: DragState): string {
    if (drag.mode === 'resize') return 'Estirar nota';
    return this.dragGroup.length > 1 ? 'Mover notas' : 'Mover nota';
  }

  private pointerPosition(point: Point): { pointerTick: Ticks; pointerPitch: number } {
    const layout = this.layout();
    return {
      pointerTick: geo.yToTick(point.y, layout),
      pointerPitch: geo.xToPitch(point.x, layout),
    };
  }

  private localPoint(event: MouseEvent): Point {
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
}
