import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { measureStart, ticksPerMeasure } from '../../domain/model/time';
import { formatMeasureChords } from '../../domain/services/chord-line';
import { SongStore } from '../editor/song-store';
import {
  gridHeight,
  PianoRollLayout,
  ticksToPixels,
  tickToY,
} from '../piano-roll/piano-roll-geometry';

/**
 * Columna de acordes alineada con los compases del piano roll. Cada compás tiene una casilla
 * de texto ("C", "Am F", "G7"); si algún símbolo no se reconoce, la casilla se marca y no
 * cambia nada.
 */
@Component({
  selector: 'app-chord-lane',
  templateUrl: './chord-lane.html',
  styleUrl: './chord-lane.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChordLane {
  readonly layout = input.required<PianoRollLayout>();

  private readonly store = inject(SongStore);
  private readonly errorsState = signal<ReadonlyMap<number, string>>(new Map());

  protected readonly height = computed(() => gridHeight(this.layout()));
  protected readonly measures = computed(() => {
    const layout = this.layout();
    const song = this.store.song();
    const measureHeight = ticksToPixels(ticksPerMeasure(layout.signature), layout);
    return Array.from({ length: layout.measures }, (_, index) => ({
      index,
      top: tickToY(measureStart(index + 1, layout.signature), layout),
      height: measureHeight,
      text: formatMeasureChords(song, index),
      error: this.errorsState().get(index) ?? null,
    }));
  });

  protected commit(index: number, text: string): void {
    const invalid = this.store.setMeasureChords(index, text);
    const errors = new Map(this.errorsState());
    if (invalid.length > 0) {
      errors.set(index, `No reconozco: ${invalid.join(', ')}`);
    } else {
      errors.delete(index);
    }
    this.errorsState.set(errors);
  }
}
