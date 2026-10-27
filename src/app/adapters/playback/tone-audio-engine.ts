import type * as ToneModule from 'tone';
import { AudioEngine } from '../../application/ports/out/audio-engine.port';
import type { PlaybackEvent } from '../../domain/services/playback-events';
import { Tone, ToneInstruments } from './tone-instruments';

/**
 * Adaptador de AudioEngine con Tone.js. La librería se carga con import() dinámico en
 * unlock(), que siempre ocurre tras un gesto del usuario, así no pesa en la carga inicial.
 */
export class ToneAudioEngine implements AudioEngine {
  private tone: Tone | null = null;
  private instruments: ToneInstruments | null = null;
  private part: ToneModule.Part<PlaybackEvent> | null = null;
  private running = false;

  async unlock(): Promise<void> {
    this.tone ??= await import('tone');
    await this.tone.start();
    this.instruments ??= new ToneInstruments(this.tone);
  }

  start(events: readonly PlaybackEvent[], durationSeconds: number): void {
    const tone = this.tone;
    const instruments = this.instruments;
    if (!tone || !instruments) {
      throw new Error('ToneAudioEngine: llama a unlock() antes de start().');
    }
    this.stop();
    const transport = tone.getTransport();
    this.part = new tone.Part<PlaybackEvent>(
      (time, event) => instruments.trigger(event, time),
      [...events],
    ).start(0);
    transport.scheduleOnce(
      (time) => tone.getDraw().schedule(() => this.stop(), time),
      durationSeconds,
    );
    transport.seconds = 0;
    transport.start();
    this.running = true;
  }

  stop(): void {
    if (!this.tone) {
      return;
    }
    const transport = this.tone.getTransport();
    transport.stop();
    transport.cancel(0);
    this.part?.dispose();
    this.part = null;
    this.instruments?.releaseAll();
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  elapsedSeconds(): number {
    return this.running && this.tone ? this.tone.getTransport().seconds : 0;
  }
}
