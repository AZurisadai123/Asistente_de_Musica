import { Chord, Song } from '../../domain/model/song';
import { replaceMeasureChords } from '../../domain/services/chord-line';
import { SongCommand } from './song-command';

/** Reemplaza todos los acordes de un compás (lo que se escribió en su casilla). */
export class ReplaceMeasureChordsCommand implements SongCommand {
  readonly label = 'Cambiar acordes';

  constructor(
    private readonly measureIndex: number,
    private readonly before: readonly Chord[],
    private readonly after: readonly Chord[],
  ) {}

  apply(song: Song): Song {
    return replaceMeasureChords(song, this.measureIndex, [...this.after]);
  }

  revert(song: Song): Song {
    return replaceMeasureChords(song, this.measureIndex, [...this.before]);
  }
}
