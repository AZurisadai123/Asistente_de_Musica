/** Genera identificadores únicos para canciones, notas, acordes y secciones. */
export interface IdGenerator {
  next(): string;
}
