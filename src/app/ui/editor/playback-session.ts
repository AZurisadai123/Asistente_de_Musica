import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Song } from '../../domain/model/song';
import { Ticks } from '../../domain/model/time';
import { PLAYBACK } from '../ports.tokens';

/**
 * Estado de reproducción compartido por los componentes del editor (controles y piano roll).
 * Mientras suena, actualiza la posición en cada cuadro de animación.
 */
@Injectable()
export class PlaybackSession {
  private readonly playback = inject(PLAYBACK);
  private readonly playingState = signal(false);
  private readonly tickState = signal<Ticks>(0);
  private readonly metronomeState = signal(false);
  private frame: number | null = null;

  readonly playing = this.playingState.asReadonly();
  readonly tick = this.tickState.asReadonly();
  readonly metronome = this.metronomeState.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.playback.stop();
      this.cancelFrame();
    });
  }

  async toggle(song: Song): Promise<void> {
    if (this.playback.isPlaying()) {
      this.playback.stop();
    } else {
      await this.playback.play(song);
    }
    this.sync();
  }

  async setMetronome(enabled: boolean): Promise<void> {
    this.metronomeState.set(enabled);
    await this.playback.setMetronome(enabled);
  }

  private sync(): void {
    const playing = this.playback.isPlaying();
    this.playingState.set(playing);
    this.tickState.set(this.playback.currentTick());
    this.cancelFrame();
    if (playing) {
      this.frame = requestAnimationFrame(() => this.sync());
    }
  }

  private cancelFrame(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }
}
