import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { CryptoIdGenerator } from './adapters/ids/crypto-id-generator';
import { ID_GENERATOR } from './ui/ports.tokens';

/** Raíz de composición: el único lugar donde cada puerto se conecta con su adaptador. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
  ],
};
