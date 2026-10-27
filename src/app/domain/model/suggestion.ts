import { Ticks } from './time';

export type Severity = 'error' | 'warning' | 'idea';

export type RuleCategory = 'structure' | 'meter' | 'melody' | 'harmony' | 'variety';

export interface SuggestionLocation {
  readonly sectionId?: string;
  /** Índice de compás desde 0. */
  readonly measure: number;
  readonly tick?: Ticks;
}

/** Resultado de una regla. Es una sugerencia, no una ley: siempre explica su motivo. */
export interface Suggestion {
  readonly ruleId: string;
  readonly category: RuleCategory;
  readonly severity: Severity;
  readonly locations: readonly SuggestionLocation[];
  readonly message: string;
  readonly explanation: string;
}
