import { InjectionToken } from '@angular/core';
import { IdGenerator } from '../application/ports/out/id-generator.port';

/**
 * Tokens de inyección de los puertos. La interfaz usa estos tokens y nunca importa
 * adaptadores: app.config.ts decide qué implementación corresponde a cada puerto.
 */
export const ID_GENERATOR = new InjectionToken<IdGenerator>('IdGenerator');
