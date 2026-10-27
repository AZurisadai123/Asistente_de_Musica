import { Song } from '../../domain/model/song';
import { Ticks } from '../../domain/model/time';
import {
  buildPlaybackEvents,
  secondsToTicks,
  songEndTick,
  ticksToSeconds,
} from '../../domain/services/playback-events';
import { Playback } from '../ports/in/playback.port';
import { AudioEngine } from '../ports/out/audio-engine.port';

const PREVIEW_SECONDS = 0.35;
const PREVIEW_VELOCITY = 0.7;

export class PlaybackUseCase implements Playback {
  private song: Song | null = null;
  private startTick: Ticks = 0;
  private metronome = false;

  constructor(private readonly engine: AudioEngine) {}

  async play(song: Song, fromTick: Ticks = 0): Promise<void> {
    await this.engine.unlock();
    this.engine.stop();
    this.song = song;
    this.startTick = fromTick;
    const duration = ticksToSeconds(songEndTick(song) - fromTick, song.tempo);
    if (duration <= 0) {
      return;
    }
    const events = buildPlaybackEvents(song, { fromTick, metronome: this.metronome });
    this.engine.start(events, duration);
  }

  stop(): void {
    this.engine.stop();
  }

  async previewPitch(pitch: number): Promise<void> {
    await this.engine.unlock();
    this.engine.playNow({
      kind: 'melody',
      time: 0,
      duration: PREVIEW_SECONDS,
      pitches: [pitch],
      velocity: PREVIEW_VELOCITY,
    });
  }

  isPlaying(): boolean {
    return this.engine.isRunning();
  }

  currentTick(): Ticks {
    if (!this.song || !this.engine.isRunning()) {
      return this.startTick;
    }
    return this.startTick + secondsToTicks(this.engine.elapsedSeconds(), this.song.tempo);
  }

  async setMetronome(enabled: boolean): Promise<void> {
    this.metronome = enabled;
    if (this.song && this.isPlaying()) {
      await this.play(this.song, this.currentTick());
    }
  }

  isMetronomeEnabled(): boolean {
    return this.metronome;
  }
}
