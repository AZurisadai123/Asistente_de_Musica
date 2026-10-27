import { Component, inject } from '@angular/core';
import { createDemoSong } from './application/samples/demo-song';
import { keyDisplayName } from './domain/theory/keys';
import { ID_GENERATOR } from './ui/ports.tokens';
import { Transport } from './ui/transport/transport';

@Component({
  selector: 'app-root',
  imports: [Transport],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = 'Asistente de música';
  private readonly ids = inject(ID_GENERATOR);
  protected readonly song = createDemoSong(() => this.ids.next());
  protected readonly keyName = this.song.key ? keyDisplayName(this.song.key) : 'Sin tonalidad';
}
