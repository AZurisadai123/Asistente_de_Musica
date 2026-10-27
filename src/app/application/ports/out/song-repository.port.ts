import { Song } from '../../../domain/model/song';

export interface SongSummary {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
}

/** Guardado local de canciones. El adaptador previsto usa IndexedDB. */
export interface SongRepository {
  list(): Promise<SongSummary[]>;
  load(id: string): Promise<Song | null>;
  save(song: Song): Promise<void>;
  remove(id: string): Promise<void>;
}
