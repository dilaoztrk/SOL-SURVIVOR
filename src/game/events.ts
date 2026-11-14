import type { MissionCard, NasaEvent } from '../types/game.ts'

/** Sol 1-10 act 1, 11-20 act 2, 21 ve sonrası act 3. */
export function actForSol(sol: number): 1 | 2 | 3 {
  if (sol <= 10) return 1
  if (sol <= 20) return 2
  return 3
}

/** Kartın bağlı olduğu NASA olayı (condition.nasaEventId ile). Yoksa null. */
export function findLinkedEvent(
  card: MissionCard,
  nasaEvents: readonly NasaEvent[],
): NasaEvent | null {
  const id = card.condition?.nasaEventId
  if (id === undefined) return null
  return nasaEvents.find((e) => e.id === id) ?? null
}

/** Kart bir NASA olayına bağlı mı (condition.nasaEventId dolu mu). */
export function isNasaLinkedCard(card: MissionCard): boolean {
  return card.condition?.nasaEventId !== undefined
}

/** Bağlı olayın sol'ü verilen sol'e eşitse true. Bağlı olmayan kart için false. */
export function isNasaCardActive(
  card: MissionCard,
  sol: number,
  nasaEvents: readonly NasaEvent[],
): boolean {
  const event = findLinkedEvent(card, nasaEvents)
  return event !== null && event.sol === sol
}

/** requiresFlags ve excludesFlags koşulları. */
export function flagConditionsMet(card: MissionCard, flags: readonly string[]): boolean {
  const c = card.condition
  if (!c) return true
  if (c.requiresFlags && !c.requiresFlags.every((f) => flags.includes(f))) return false
  if (c.excludesFlags && c.excludesFlags.some((f) => flags.includes(f))) return false
  return true
}

/** minSol ve maxSol koşulları. */
export function solConditionsMet(card: MissionCard, sol: number): boolean {
  const c = card.condition
  if (!c) return true
  if (c.minSol !== undefined && sol < c.minSol) return false
  if (c.maxSol !== undefined && sol > c.maxSol) return false
  return true
}

/**
 * Kart bu sol için uygun mu?
 * - NASA'ya bağlı kart: yalnız olayın sol'ünde, act aranmadan, bayrak koşulları aranarak uygundur.
 * - Diğer kartlar: act sol'e uymalı, sol ve bayrak koşulları tutmalı.
 */
export function isCardEligible(
  card: MissionCard,
  sol: number,
  flags: readonly string[],
  nasaEvents: readonly NasaEvent[],
): boolean {
  if (isNasaLinkedCard(card)) {
    return isNasaCardActive(card, sol, nasaEvents) && flagConditionsMet(card, flags)
  }
  return (
    card.act === actForSol(sol) && solConditionsMet(card, sol) && flagConditionsMet(card, flags)
  )
}

/** Kartlardan ya da olaylardan biri origin 'test' ise true. */
export function computeUsingTestData(
  cards: readonly MissionCard[],
  nasaEvents: readonly NasaEvent[],
): boolean {
  return cards.some((c) => c.origin === 'test') || nasaEvents.some((e) => e.origin === 'test')
}
