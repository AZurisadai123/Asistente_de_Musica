import type * as ToneModule from 'tone';
import type { PlaybackEvent, PlaybackEventKind } from '../../domain/services/playback-events';

export type Tone = typeof ToneModule;

/** Un sintetizador por tipo de evento, para que melodía, acordes y metrónomo no se pisen. */
export class ToneInstruments {
  private readonly voices: Record<PlaybackEventKind, ToneModule.PolySynth>;

  constructor(private readonly tone: Tone) {
    this.voices = {
      melody: this.synth('triangle', -6),
      chord: this.synth('sine', -14),
      click: this.synth('square', -18),
    };
  }

  trigger(event: PlaybackEvent, time: number): void {
    const frequencies = event.pitches.map((pitch) =>
      this.tone.mtof(pitch as ToneModule.Unit.MidiNote),
    );
    this.voices[event.kind].triggerAttackRelease(frequencies, event.duration, time, event.velocity);
  }

  releaseAll(): void {
    Object.values(this.voices).forEach((voice) => voice.releaseAll());
  }

  private synth(type: 'triangle' | 'sine' | 'square', volume: number): ToneModule.PolySynth {
    const synth = new this.tone.PolySynth(this.tone.Synth, {
      oscillator: { type },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.3 },
    });
    synth.volume.value = volume;
    return synth.toDestination();
  }
}
