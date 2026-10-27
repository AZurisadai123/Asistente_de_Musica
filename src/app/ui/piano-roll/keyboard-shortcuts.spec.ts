import { KeyInput, shortcutFor } from './keyboard-shortcuts';

function key(k: string, mods: Partial<Omit<KeyInput, 'key'>> = {}): KeyInput {
  return { key: k, ctrlKey: false, metaKey: false, shiftKey: false, ...mods };
}

describe('shortcutFor', () => {
  it('deshacer y rehacer con Ctrl o Cmd', () => {
    expect(shortcutFor(key('z', { ctrlKey: true }))).toEqual({ type: 'undo' });
    expect(shortcutFor(key('Z', { metaKey: true, shiftKey: true }))).toEqual({ type: 'redo' });
    expect(shortcutFor(key('y', { ctrlKey: true }))).toEqual({ type: 'redo' });
  });

  it('portapapeles y selección', () => {
    expect(shortcutFor(key('c', { ctrlKey: true }))).toEqual({ type: 'copy' });
    expect(shortcutFor(key('v', { ctrlKey: true }))).toEqual({ type: 'paste' });
    expect(shortcutFor(key('d', { ctrlKey: true }))).toEqual({ type: 'duplicate' });
    expect(shortcutFor(key('a', { ctrlKey: true }))).toEqual({ type: 'selectAll' });
    expect(shortcutFor(key('Escape'))).toEqual({ type: 'clearSelection' });
  });

  it('borrar con Supr o Retroceso', () => {
    expect(shortcutFor(key('Delete'))).toEqual({ type: 'delete' });
    expect(shortcutFor(key('Backspace'))).toEqual({ type: 'delete' });
  });

  it('flechas: semitono, octava con Mayús y una celda en el tiempo', () => {
    expect(shortcutFor(key('ArrowUp'))).toEqual({ type: 'move', gridSteps: 0, semitones: 1 });
    expect(shortcutFor(key('ArrowDown', { shiftKey: true }))).toEqual({
      type: 'move',
      gridSteps: 0,
      semitones: -12,
    });
    expect(shortcutFor(key('ArrowRight'))).toEqual({ type: 'move', gridSteps: 1, semitones: 0 });
    expect(shortcutFor(key('ArrowLeft'))).toEqual({ type: 'move', gridSteps: -1, semitones: 0 });
  });

  it('las demás teclas no son atajos', () => {
    expect(shortcutFor(key('c'))).toBeNull();
    expect(shortcutFor(key('q', { ctrlKey: true }))).toBeNull();
  });
});
