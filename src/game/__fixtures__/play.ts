// Testler için oynatma yardımcıları. Motor dosyaları bunu import etmez.
import type { GameConfig, GameState, MissionCard, NasaEvent } from '../../types/game.ts'
import { choose, DEFAULT_CONFIG, getCurrentCard, RESOURCE_KEYS } from '../engine.ts'

export type Policy = (state: GameState, card: MissionCard) => 'a' | 'b'

/** Anlık etkiden sonra en düşük kaynağı en yüksek tutan seçenek. Eşitlikte 'a'. */
export const safePolicy: Policy = (state, card) => {
  const score = (id: 'a' | 'b'): number => {
    const choice = card.choices.find((c) => c.id === id)
    return Math.min(...RESOURCE_KEYS.map((k) => state.resources[k] + (choice?.effects[k] ?? 0)))
  }
  return score('a') >= score('b') ? 'a' : 'b'
}

export const alwaysA: Policy = () => 'a'
export const alwaysB: Policy = () => 'b'

/** Oyun bitene ya da maxSteps seçime kadar oynar. Oyun sürerken kart bulunamazsa hata fırlatır. */
export function play(
  start: GameState,
  cards: readonly MissionCard[],
  nasaEvents: readonly NasaEvent[] = [],
  config: GameConfig = DEFAULT_CONFIG,
  policy: Policy = safePolicy,
  maxSteps = 1000,
): GameState {
  let state = start
  for (let step = 0; step < maxSteps && state.status === 'playing'; step++) {
    const card = getCurrentCard(state, cards)
    if (!card) throw new Error(`Sol ${state.sol}: oyun sürüyor ama kart yok`)
    state = choose(state, cards, policy(state, card), nasaEvents, config)
  }
  return state
}
