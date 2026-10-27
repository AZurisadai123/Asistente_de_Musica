import { Note } from './song';
import { isValidTicks } from './time';

export type NoteProblem =
  'pitch-out-of-range' | 'invalid-start' | 'invalid-duration' | 'velocity-out-of-range';

const MIDI_MIN = 0;
const MIDI_MAX = 127;

/** Devuelve la lista de problemas de una nota; vacía si es válida. */
export function validateNote(note: Note): NoteProblem[] {
  const problems: NoteProblem[] = [];
  if (!Number.isInteger(note.pitch) || note.pitch < MIDI_MIN || note.pitch > MIDI_MAX) {
    problems.push('pitch-out-of-range');
  }
  if (!isValidTicks(note.start)) {
    problems.push('invalid-start');
  }
  if (!isValidTicks(note.duration) || note.duration === 0) {
    problems.push('invalid-duration');
  }
  if (!Number.isInteger(note.velocity) || note.velocity < 1 || note.velocity > MIDI_MAX) {
    problems.push('velocity-out-of-range');
  }
  return problems;
}

export function noteEnd(note: Pick<Note, 'start' | 'duration'>): number {
  return note.start + note.duration;
}
