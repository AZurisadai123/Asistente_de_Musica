import { Song } from '../model/song';
import { createEmptySong } from '../model/song-factory';
import {
  buildPlaybackEvents,
  secondsToTicks,
  songEndTick,
  ticksToSeconds,
} from './playback-events';

function song(overrides: Partial<Song> = {}): Song {
  return { ...createEmptySong('s'), tempo: 120, ...overrides };
}

describe('conversión de tiempo', () => {
  it('a 120 BPM una negra dura medio segundo', () => {
    expect(ticksToSeconds(480, 120)).toBe(0.5);
    expect(ticksToSeconds(1920, 60)).toBe(4);
    expect(secondsToTicks(0.5, 120)).toBe(480);
  });
});

describe('buildPlaybackEvents', () => {
  const notes = [
    { id: 'a', pitch: 60, start: 0, duration: 480, velocity: 127 },
    { id: 'b', pitch: 62, start: 960, duration: 240, velocity: 64 },
  ];
  const chords = [
    { id: 'c', symbol: 'C', start: 0, duration: 1920 },
    { id: 'd', symbol: '???', start: 1920, duration: 1920 },
  ];

  it('convierte notas y acordes a segundos', () => {
    const events = buildPlaybackEvents(song({ notes, chords }));
    expect(events.filter((e) => e.kind === 'melody')).toEqual([
      { kind: 'melody', time: 0, duration: 0.5, pitches: [60], velocity: 1 },
      { kind: 'melody', time: 1, duration: 0.25, pitches: [62], velocity: 64 / 127 },
    ]);
    const chordEvents = events.filter((e) => e.kind === 'chord');
    expect(chordEvents).toHaveLength(1);
    expect(chordEvents[0]).toMatchObject({ time: 0, duration: 2, pitches: [48, 52, 55] });
  });

  it('empieza desde fromTick con tiempos relativos', () => {
    const events = buildPlaybackEvents(song({ notes }), { fromTick: 480 });
    expect(events).toEqual([
      { kind: 'melody', time: 0.5, duration: 0.25, pitches: [62], velocity: 64 / 127 },
    ]);
  });

  it('agrega clics de metrónomo con acento en el primer tiempo', () => {
    const events = buildPlaybackEvents(song({ notes }), { metronome: true });
    const clicks = events.filter((e) => e.kind === 'click');
    expect(clicks).toHaveLength(4);
    expect(clicks.map((c) => c.time)).toEqual([0, 0.5, 1, 1.5]);
    expect(clicks[0].velocity).toBeGreaterThan(clicks[1].velocity);
  });

  it('devuelve los eventos ordenados por tiempo', () => {
    const events = buildPlaybackEvents(song({ notes, chords }), { metronome: true });
    const times = events.map((e) => e.time);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe('songEndTick', () => {
  it('redondea al final del último compás ocupado', () => {
    const s = song({ notes: [{ id: 'a', pitch: 60, start: 1920, duration: 480, velocity: 90 }] });
    expect(songEndTick(s)).toBe(3840);
    expect(songEndTick(song())).toBe(0);
  });
});
