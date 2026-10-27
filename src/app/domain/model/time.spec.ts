import {
  COMMON_TIME,
  isValidTicks,
  measureIndexAt,
  measureStart,
  snapToGrid,
  ticksPerBeat,
  ticksPerMeasure,
  TimeSignature,
} from './time';

const SIX_EIGHT: TimeSignature = { beats: 6, beatUnit: 8 };
const THREE_FOUR: TimeSignature = { beats: 3, beatUnit: 4 };
const TICKS_SIXTEENTH = 120;

describe('time', () => {
  it('calcula ticks por tiempo y por compás', () => {
    expect(ticksPerBeat(COMMON_TIME)).toBe(480);
    expect(ticksPerMeasure(COMMON_TIME)).toBe(1920);
    expect(ticksPerMeasure(THREE_FOUR)).toBe(1440);
    expect(ticksPerBeat(SIX_EIGHT)).toBe(240);
    expect(ticksPerMeasure(SIX_EIGHT)).toBe(1440);
  });

  it('ubica un tick en su compás', () => {
    expect(measureIndexAt(0, COMMON_TIME)).toBe(0);
    expect(measureIndexAt(1919, COMMON_TIME)).toBe(0);
    expect(measureIndexAt(1920, COMMON_TIME)).toBe(1);
    expect(measureStart(3, THREE_FOUR)).toBe(4320);
  });

  it('acepta solo ticks enteros no negativos', () => {
    expect(isValidTicks(0)).toBe(true);
    expect(isValidTicks(480)).toBe(true);
    expect(isValidTicks(-1)).toBe(false);
    expect(isValidTicks(0.5)).toBe(false);
  });

  it('ajusta a la rejilla más cercana', () => {
    expect(snapToGrid(250, 240)).toBe(240);
    expect(snapToGrid(370, 240)).toBe(480);
  });

  it('suma duraciones sin errores de redondeo', () => {
    const total = Array.from({ length: 16 }, () => TICKS_SIXTEENTH).reduce((a, b) => a + b, 0);
    expect(total).toBe(ticksPerMeasure(COMMON_TIME));
  });
});
