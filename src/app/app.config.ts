import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { CryptoIdGenerator } from './adapters/ids/crypto-id-generator';
import { ToneAudioEngine } from './adapters/playback/tone-audio-engine';
import { PlaybackUseCase } from './application/use-cases/playback.use-case';
import { ID_GENERATOR, PLAYBACK } from './ui/ports.tokens';

/** Raíz de composición: el único lugar donde cada puerto se conecta con su adaptador. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
    { provide: PLAYBACK, useFactory: () => new PlaybackUseCase(new ToneAudioEngine()) },
  ],
};
