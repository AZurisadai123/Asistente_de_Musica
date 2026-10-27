import { Song } from '../../domain/model/song';
import { createEmptySong } from '../../domain/model/song-factory';
import { PlaybackEvent } from '../../domain/services/playback-events';
import { AudioEngine } from '../ports/out/audio-engine.port';
import { PlaybackUseCase } from './playback.use-case';

/** Motor falso: registra lo que recibe y permite fijar los segundos transcurridos. */
class FakeAudioEngine implements AudioEngine {
  unlocked = false;
  running = false;
  elapsed = 0;
  starts: { events: readonly PlaybackEvent[]; duration: number }[] = [];

  async unlock(): Promise<void> {
    this.unlocked = true;
  }
  start(events: readonly PlaybackEvent[], duration: number): void {
    this.starts.push({ events, duration });
    this.running = true;
    this.elapsed = 0;
  }
  nowEvents: PlaybackEvent[] = [];
  playNow(event: PlaybackEvent): void {
    this.nowEvents.push(event);
  }
  stop(): void {
    this.running = false;
  }
  isRunning(): boolean {
    return this.running;
  }
  elapsedSeconds(): number {
    return this.elapsed;
  }
}

const twoMeasureSong: Song = {
  ...createEmptySong('s'),
  tempo: 120,
  notes: [
    { id: 'a', pitch: 60, start: 0, duration: 480, velocity: 90 },
    { id: 'b', pitch: 64, start: 1920, duration: 480, velocity: 90 },
  ],
};

describe('PlaybackUseCase', () => {
  let engine: FakeAudioEngine;
  let playback: PlaybackUseCase;

  beforeEach(() => {
    engine = new FakeAudioEngine();
    playback = new PlaybackUseCase(engine);
  });

  it('desbloquea el audio y programa la canción completa', async () => {
    await playback.play(twoMeasureSong);
    expect(engine.unlocked).toBe(true);
    expect(engine.starts).toHaveLength(1);
    expect(engine.starts[0].duration).toBe(4);
    expect(engine.starts[0].events).toHaveLength(2);
    expect(playback.isPlaying()).toBe(true);
  });

  it('no arranca con una canción vacía', async () => {
    await playback.play(createEmptySong('vacia'));
    expect(engine.starts).toHaveLength(0);
    expect(playback.isPlaying()).toBe(false);
  });

  it('calcula la posición actual a partir del tiempo transcurrido', async () => {
    await playback.play(twoMeasureSong, 960);
    engine.elapsed = 0.5;
    expect(playback.currentTick()).toBe(1440);
    playback.stop();
    expect(playback.currentTick()).toBe(960);
  });

  it('al activar el metrónomo mientras suena, reinicia desde la posición actual', async () => {
    await playback.play(twoMeasureSong);
    engine.elapsed = 1;
    await playback.setMetronome(true);
    expect(engine.starts).toHaveLength(2);
    const restart = engine.starts[1];
    expect(restart.duration).toBe(3);
    expect(restart.events.some((e) => e.kind === 'click')).toBe(true);
    expect(playback.isMetronomeEnabled()).toBe(true);
  });

  it('toca una nota suelta sin iniciar la reproducción', async () => {
    await playback.previewPitch(67);
    expect(engine.unlocked).toBe(true);
    expect(engine.nowEvents).toEqual([expect.objectContaining({ pitches: [67], time: 0 })]);
    expect(engine.starts).toHaveLength(0);
  });

  it('activar el metrónomo detenido solo guarda la preferencia', async () => {
    await playback.setMetronome(true);
    expect(engine.starts).toHaveLength(0);
    await playback.play(twoMeasureSong);
    expect(engine.starts[0].events.some((e) => e.kind === 'click')).toBe(true);
  });
});
