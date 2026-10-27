export type Clef = 'treble' | 'bass' | 'alto';

/**
 * Cómo se escribe un instrumento en la partitura. El rango está en altura real (sonido).
 * transposition = semitonos que se suman al sonido para obtener la nota escrita.
 */
export interface InstrumentProfile {
  readonly id: string;
  readonly name: string;
  /** Un elemento por pentagrama; el piano usa dos. */
  readonly clefs: readonly Clef[];
  readonly lowestPitch: number;
  readonly highestPitch: number;
  readonly transposition: number;
}

export function writtenPitch(soundingPitch: number, profile: InstrumentProfile): number {
  return soundingPitch + profile.transposition;
}

export function isInRange(soundingPitch: number, profile: InstrumentProfile): boolean {
  return soundingPitch >= profile.lowestPitch && soundingPitch <= profile.highestPitch;
}
