import { IdGenerator } from '../../application/ports/out/id-generator.port';

/** Adaptador de IdGenerator basado en la Web Crypto API del navegador. */
export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
