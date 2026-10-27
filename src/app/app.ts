import { Component } from '@angular/core';
import { EditorPage } from './ui/editor/editor-page';

@Component({
  selector: 'app-root',
  imports: [EditorPage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = 'Asistente de música';
}
