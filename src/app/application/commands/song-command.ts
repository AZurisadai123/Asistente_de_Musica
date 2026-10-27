import { Song } from '../../domain/model/song';

/**
 * Cambio reversible sobre la canción (patrón de comandos). apply y revert son funciones
 * puras: reciben una canción y devuelven otra, así deshacer y rehacer no guardan copias.
 */
export interface SongCommand {
  /** Texto corto para la interfaz, por ejemplo "Mover nota". */
  readonly label: string;
  apply(song: Song): Song;
  revert(song: Song): Song;
}
