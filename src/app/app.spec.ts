import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ID_GENERATOR, PLAYBACK } from './ui/ports.tokens';

describe('App', () => {
  beforeEach(async () => {
    let n = 0;
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: ID_GENERATOR, useValue: { next: () => `id${++n}` } },
        { provide: PLAYBACK, useValue: { isPlaying: () => false, stop: () => undefined } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título y la canción de ejemplo', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Asistente de música');
    expect(compiled.textContent).toContain('Do mayor');
  });
});
