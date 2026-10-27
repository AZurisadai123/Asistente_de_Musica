/**
 * Acciones del editor que se pueden disparar con el teclado. move usa celdas de rejilla
 * en el tiempo y semitonos en la altura.
 */
export type EditorAction =
  | { readonly type: 'undo' | 'redo' | 'delete' | 'selectAll' | 'clearSelection' }
  | { readonly type: 'copy' | 'paste' | 'duplicate' }
  | { readonly type: 'move'; readonly gridSteps: number; readonly semitones: number };

export interface KeyInput {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

const OCTAVE = 12;

/** Traduce una tecla a una acción del editor, o null si no es un atajo. */
export function shortcutFor(event: KeyInput): EditorAction | null {
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (mod) {
    return modifiedShortcut(key, event.shiftKey);
  }
  switch (key) {
    case 'delete':
    case 'backspace':
      return { type: 'delete' };
    case 'escape':
      return { type: 'clearSelection' };
    case 'arrowup':
      return { type: 'move', gridSteps: 0, semitones: event.shiftKey ? OCTAVE : 1 };
    case 'arrowdown':
      return { type: 'move', gridSteps: 0, semitones: event.shiftKey ? -OCTAVE : -1 };
    case 'arrowright':
      return { type: 'move', gridSteps: 1, semitones: 0 };
    case 'arrowleft':
      return { type: 'move', gridSteps: -1, semitones: 0 };
    default:
      return null;
  }
}

function modifiedShortcut(key: string, shift: boolean): EditorAction | null {
  switch (key) {
    case 'z':
      return { type: shift ? 'redo' : 'undo' };
    case 'y':
      return { type: 'redo' };
    case 'a':
      return { type: 'selectAll' };
    case 'c':
      return { type: 'copy' };
    case 'v':
      return { type: 'paste' };
    case 'd':
      return { type: 'duplicate' };
    default:
      return null;
  }
}
