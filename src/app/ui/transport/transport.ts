import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Song } from '../../domain/model/song';
import { measureIndexAt, measureStart, ticksPerBeat } from '../../domain/model/time';
import { PlaybackSession } from '../editor/playback-session';

/** Controles de reproducción: reproducir, detener, metrónomo y posición actual. */
@Component({
  selector: 'app-transport',
  templateUrl: './transport.html',
  styleUrl: './transport.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Transport {
  readonly song = input.required<Song>();

  protected readonly session = inject(PlaybackSession);

  protected readonly position = computed(() => {
    const tick = this.session.tick();
    const signature = this.song().timeSignature;
    const measure = measureIndexAt(tick, signature);
    const beat = Math.floor((tick - measureStart(measure, signature)) / ticksPerBeat(signature));
    return `${measure + 1}.${beat + 1}`;
  });

  protected toggle(): Promise<void> {
    return this.session.toggle(this.song());
  }

  protected toggleMetronome(enabled: boolean): Promise<void> {
    return this.session.setMetronome(enabled);
  }
}
