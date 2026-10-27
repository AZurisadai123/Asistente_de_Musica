import { PlaybackEvent } from '../../../domain/services/playback-events';

/**
 * Motor de audio de bajo nivel. Solo programa eventos ya calculados: no sabe de compases,
 * tempo ni acordes. El adaptador previsto usa Tone.js.
 */
export interface AudioEngine {
  /** Debe llamarse desde un gesto del usuario: el navegador bloquea el audio antes de eso. */
  unlock(): Promise<void>;
  /** Programa los eventos (tiempos relativos al arranque) y se detiene solo al llegar a durationSeconds. */
  start(events: readonly PlaybackEvent[], durationSeconds: number): void;
  /** Toca un evento de inmediato, sin afectar la reproducción en curso. */
  playNow(event: PlaybackEvent): void;
  stop(): void;
  isRunning(): boolean;
  /** Segundos transcurridos desde start(); 0 si no está sonando. */
  elapsedSeconds(): number;
}
