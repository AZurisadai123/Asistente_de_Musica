import { COMMON_TIME } from '../../domain/model/time';
import {
  gridHeight,
  gridLines,
  gridWidth,
  hitTest,
  isBlackKey,
  noteRect,
  PianoRollLayout,
  pitchToY,
  snapDown,
  tickToX,
  xToTick,
  yToPitch,
} from './piano-roll-geometry';

const layout: PianoRollLayout = {
  lowestPitch: 48,
  highestPitch: 72,
  rowHeight: 10,
  pixelsPerQuarter: 40,
  measures: 2,
  signature: COMMON_TIME,
};

const note = { id: 'a', pitch: 60, start: 480, duration: 960, velocity: 90 };

describe('piano-roll-geometry', () => {
  it('convierte ticks y píxeles en ambos sentidos', () => {
    expect(tickToX(480, layout)).toBe(40);
    expect(xToTick(40, layout)).toBe(480);
    expect(xToTick(-5, layout)).toBe(0);
  });

  it('convierte alturas y filas, con la nota más aguda arriba', () => {
    expect(pitchToY(72, layout)).toBe(0);
    expect(pitchToY(60, layout)).toBe(120);
    expect(yToPitch(125, layout)).toBe(60);
    expect(yToPitch(-50, layout)).toBe(72);
    expect(yToPitch(9999, layout)).toBe(48);
  });

  it('calcula el tamaño de la rejilla', () => {
    expect(gridWidth(layout)).toBe(320);
    expect(gridHeight(layout)).toBe(250);
  });

  it('calcula el rectángulo de una nota', () => {
    expect(noteRect(note, layout)).toEqual({ x: 40, y: 120, width: 80, height: 10 });
  });

  it('detecta el cuerpo y el borde para estirar', () => {
    expect(hitTest([note], 50, 125, layout)?.zone).toBe('body');
    expect(hitTest([note], 117, 125, layout)?.zone).toBe('resize');
    expect(hitTest([note], 130, 125, layout)).toBeNull();
    expect(hitTest([note], 50, 135, layout)).toBeNull();
  });

  it('marca las teclas negras', () => {
    expect(isBlackKey(61)).toBe(true);
    expect(isBlackKey(60)).toBe(false);
  });

  it('alinea al inicio de la celda', () => {
    expect(snapDown(359, 240)).toBe(240);
  });

  it('marca como fuertes las líneas de compás', () => {
    const lines = gridLines(layout, 960);
    expect(lines.map((l) => l.strong)).toEqual([true, false, true, false, true]);
  });
});
