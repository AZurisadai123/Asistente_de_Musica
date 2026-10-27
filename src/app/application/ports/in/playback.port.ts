import { Song } from '../../../domain/model/song';
import { Ticks } from '../../../domain/model/time';

/** Reproducción de una canción, tal como la usa la interfaz. */
export interface Playback {
  /** Debe llamarse desde un gesto del usuario (clic o tecla). */
  play(song: Song, fromTick?: Ticks): Promise<void>;
  stop(): void;
  /** Toca una nota suelta, por ejemplo al crearla o moverla en el editor. */
  previewPitch(pitch: number): Promise<void>;
  isPlaying(): boolean;
  /** Posición actual, para mover el cursor del piano roll. */
  currentTick(): Ticks;
  /** Si está sonando, reinicia desde la posición actual con o sin metrónomo. */
  setMetronome(enabled: boolean): Promise<void>;
  isMetronomeEnabled(): boolean;
}
