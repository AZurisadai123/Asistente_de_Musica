import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { Song } from '../../domain/model/song';
import { measureIndexAt, measureStart, ticksPerBeat } from '../../domain/model/time';
import { PLAYBACK } from '../ports.tokens';

/** Controles de reproducción: reproducir, detener, metrónomo y posición actual. */
@Component({
  selector: 'app-transport',
  templateUrl: './transport.html',
  styleUrl: './transport.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Transport implements OnDestroy {
  readonly song = input.required<Song>();

  private readonly playback = inject(PLAYBACK);
  protected readonly playing = signal(false);
  protected readonly metronome = signal(false);
  protected readonly position = signal('1.1');
  private frame: number | null = null;

  protected async toggle(): Promise<void> {
    if (this.playback.isPlaying()) {
      this.playback.stop();
    } else {
      await this.playback.play(this.song());
    }
    this.syncState();
  }

  protected async toggleMetronome(enabled: boolean): Promise<void> {
    this.metronome.set(enabled);
    await this.playback.setMetronome(enabled);
  }

  ngOnDestroy(): void {
    this.playback.stop();
    this.cancelFrame();
  }

  /** Mientras suena, actualiza la posición en cada cuadro de animación. */
  private syncState(): void {
    const playing = this.playback.isPlaying();
    this.playing.set(playing);
    this.position.set(this.formatPosition(this.playback.currentTick()));
    this.cancelFrame();
    if (playing) {
      this.frame = requestAnimationFrame(() => this.syncState());
    }
  }

  private formatPosition(tick: number): string {
    const signature = this.song().timeSignature;
    const measure = measureIndexAt(tick, signature);
    const beat = Math.floor((tick - measureStart(measure, signature)) / ticksPerBeat(signature));
    return `${measure + 1}.${beat + 1}`;
  }

  private cancelFrame(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }
}
