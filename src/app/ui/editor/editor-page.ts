import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Ticks, TICKS_PER_QUARTER } from '../../domain/model/time';
import { keyDisplayName } from '../../domain/theory/keys';
import { PianoRoll } from '../piano-roll/piano-roll';
import { Transport } from '../transport/transport';
import { PlaybackSession } from './playback-session';
import { SongStore } from './song-store';

export interface GridOption {
  readonly label: string;
  readonly ticks: Ticks;
}

export const GRID_OPTIONS: readonly GridOption[] = [
  { label: 'Negra', ticks: TICKS_PER_QUARTER },
  { label: 'Corchea', ticks: TICKS_PER_QUARTER / 2 },
  { label: 'Semicorchea', ticks: TICKS_PER_QUARTER / 4 },
];

/** Pantalla del asistente de composición: barra de herramientas, reproducción y piano roll. */
@Component({
  selector: 'app-editor-page',
  imports: [PianoRoll, Transport],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SongStore, PlaybackSession],
})
export class EditorPage {
  protected readonly store = inject(SongStore);
  protected readonly gridOptions = GRID_OPTIONS;
  protected readonly grid = signal<Ticks>(GRID_OPTIONS[1].ticks);

  protected readonly summary = computed(() => {
    const song = this.store.song();
    const key = song.key ? keyDisplayName(song.key) : 'Sin tonalidad';
    const { beats, beatUnit } = song.timeSignature;
    return `${song.title} · ${key} · ${beats}/${beatUnit} · ${song.notes.length} notas`;
  });

  protected selectGrid(value: string): void {
    this.grid.set(Number(value));
  }
}
