import { Song } from '../../../domain/model/song';
import { Ticks } from '../../../domain/model/time';

/** Reproducción de una canción. El adaptador previsto usa Tone.js. */
export interface AudioPlayer {
  /** Debe llamarse desde un gesto del usuario: el navegador bloquea el audio antes de eso. */
  unlock(): Promise<void>;
  play(song: Song, fromTick?: Ticks): void;
  stop(): void;
  /** Posición actual de reproducción, para mover el cursor del piano roll. */
  currentTick(): Ticks;
  setMetronome(enabled: boolean): void;
}
