import { TestBed } from '@angular/core/testing';
import { Playback } from '../../application/ports/in/playback.port';
import { createEmptySong } from '../../domain/model/song-factory';
import { PLAYBACK } from '../ports.tokens';
import { Transport } from './transport';

function fakePlayback(): Playback & { playing: boolean } {
  return {
    playing: false,
    async play() {
      this.playing = true;
    },
    stop() {
      this.playing = false;
    },
    isPlaying() {
      return this.playing;
    },
    currentTick: () => 0,
    setMetronome: vi.fn(async () => undefined),
    isMetronomeEnabled: () => false,
  };
}

describe('Transport', () => {
  it('alterna entre reproducir y detener', async () => {
    const playback = fakePlayback();
    TestBed.configureTestingModule({
      imports: [Transport],
      providers: [{ provide: PLAYBACK, useValue: playback }],
    });
    const fixture = TestBed.createComponent(Transport);
    fixture.componentRef.setInput('song', createEmptySong('s'));
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;

    expect(button.textContent).toContain('Reproducir');
    button.click();
    await fixture.whenStable();
    expect(playback.playing).toBe(true);
    expect(button.textContent).toContain('Detener');

    button.click();
    await fixture.whenStable();
    expect(playback.playing).toBe(false);
    expect(button.textContent).toContain('Reproducir');
  });
});
