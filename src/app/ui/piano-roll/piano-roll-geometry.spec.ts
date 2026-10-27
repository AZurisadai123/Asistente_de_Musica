import { COMMON_TIME } from '../../domain/model/time';
import {
  blackKeyRect,
  gridHeight,
  gridLines,
  gridWidth,
  hitTest,
  isBlackKey,
  noteRect,
  PianoRollLayout,
  pitchToX,
  snapDown,
  tickToY,
  whiteKeyRect,
  xToPitch,
  yToTick,
} from './piano-roll-geometry';

/** Do3 a Do5 (25 columnas de 10 px); 2 compases de 4/4 a 40 px por negra = 320 px de alto. */
const layout: PianoRollLayout = {
  lowestPitch: 48,
  highestPitch: 72,
  columnWidth: 10,
  pixelsPerQuarter: 40,
  measures: 2,
  signature: COMMON_TIME,
};

const note = { id: 'a', pitch: 60, start: 480, duration: 960, velocity: 90 };

describe('piano-roll-geometry (vertical)', () => {
  it('calcula el tamaño de la rejilla', () => {
    expect(gridWidth(layout)).toBe(250);
    expect(gridHeight(layout)).toBe(320);
  });

  it('pone las notas graves a la izquierda', () => {
    expect(pitchToX(48, layout)).toBe(0);
    expect(pitchToX(60, layout)).toBe(120);
    expect(xToPitch(125, layout)).toBe(60);
    expect(xToPitch(-5, layout)).toBe(48);
    expect(xToPitch(9999, layout)).toBe(72);
  });

  it('pone el tick 0 abajo y el tiempo hacia arriba', () => {
    expect(tickToY(0, layout)).toBe(320);
    expect(tickToY(480, layout)).toBe(280);
    expect(yToTick(280, layout)).toBe(480);
    expect(yToTick(400, layout)).toBe(0);
  });

  it('dibuja la nota desde su inicio (abajo) hasta su final (arriba)', () => {
    expect(noteRect(note, layout)).toEqual({ x: 120, y: 200, width: 10, height: 80 });
  });

  it('detecta el cuerpo y el borde superior para estirar', () => {
    expect(hitTest([note], 125, 250, layout)?.zone).toBe('body');
    expect(hitTest([note], 125, 202, layout)?.zone).toBe('resize');
    expect(hitTest([note], 125, 290, layout)).toBeNull();
    expect(hitTest([note], 135, 250, layout)).toBeNull();
  });

  it('marca como fuertes las líneas de compás', () => {
    const lines = gridLines(layout, 960);
    expect(lines.map((l) => [l.y, l.strong])).toEqual([
      [320, true],
      [240, false],
      [160, true],
      [80, false],
      [0, true],
    ]);
  });

  it('alinea al inicio de la celda', () => {
    expect(snapDown(359, 240)).toBe(240);
  });

  describe('teclado', () => {
    it('las teclas blancas se extienden bajo las negras vecinas', () => {
      // Re (62) tiene negras a ambos lados: su columna más media columna de cada lado.
      expect(whiteKeyRect(62, layout, 60)).toEqual({ x: 135, y: 0, width: 20, height: 60 });
      // Mi (64) solo tiene negra a la izquierda.
      expect(whiteKeyRect(64, layout, 60)).toEqual({ x: 155, y: 0, width: 15, height: 60 });
    });

    it('la primera tecla no se sale del borde izquierdo', () => {
      expect(whiteKeyRect(48, layout, 60).x).toBe(0);
    });

    it('las teclas negras ocupan su columna y son más cortas', () => {
      expect(isBlackKey(61)).toBe(true);
      const rect = blackKeyRect(61, layout, 60);
      expect(rect.x).toBe(130);
      expect(rect.width).toBe(10);
      expect(rect.height).toBeLessThan(60);
    });
  });
});
