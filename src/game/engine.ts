import type {
  Effects,
  GameConfig,
  GameState,
  HistoryEntry,
  MissionCard,
  NasaEvent,
  PendingEffect,
  ResourceKey,
  Resources,
} from '../types/game.ts'
import {
  actForSol,
  computeUsingTestData,
  isCardEligible,
  isNasaLinkedCard,
} from './events.ts'

/** Kayıp kontrolündeki öncelik sırası da budur. */
export const RESOURCE_KEYS: readonly ResourceKey[] = [
  'energy',
  'food',
  'lifeSupport',
  'radiationShield',
]

export const RESOURCE_MIN = 0
export const RESOURCE_MAX = 100

export const DEFAULT_CONFIG: GameConfig = {
  totalSols: 30,
  startResources: { energy: 70, food: 70, lifeSupport: 70, radiationShield: 70 },
  dailyDrain: { energy: 0, food: 0, lifeSupport: 0, radiationShield: 0 },
}

const NO_EVENTS: readonly NasaEvent[] = []

// ---------------------------------------------------------------------------
// Kaynaklar

function clamp(value: number): number {
  return Math.min(RESOURCE_MAX, Math.max(RESOURCE_MIN, value))
}

function effectValue(effects: Effects, key: ResourceKey): number {
  const v = effects[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** Etki listesini toplar (sınırlamadan). */
function sumEffects(list: readonly Effects[]): Effects {
  const total: Effects = {}
  for (const effects of list) {
    for (const key of RESOURCE_KEYS) {
      const v = effectValue(effects, key)
      if (v !== 0) total[key] = (total[key] ?? 0) + v
    }
  }
  return total
}

/** Etkiyi uygular ve her kaynağı 0-100'e sınırlar. Girdiyi değiştirmez. */
function applyEffects(resources: Resources, effects: Effects): Resources {
  return {
    energy: clamp(resources.energy + effectValue(effects, 'energy')),
    food: clamp(resources.food + effectValue(effects, 'food')),
    lifeSupport: clamp(resources.lifeSupport + effectValue(effects, 'lifeSupport')),
    radiationShield: clamp(resources.radiationShield + effectValue(effects, 'radiationShield')),
  }
}

/** 0'a inen ilk kaynak (RESOURCE_KEYS sırasıyla). Yoksa undefined. */
function findFailedResource(resources: Resources): ResourceKey | undefined {
  return RESOURCE_KEYS.find((key) => resources[key] <= RESOURCE_MIN)
}

// ---------------------------------------------------------------------------
// Tohumlu rastgelelik: yalnız state'teki seed ve sol'den türetilir, modül durumu yoktur.

function randomFor(seed: number, sol: number): number {
  // mulberry32'nin tek adımı; (seed, sol) çifti için sabit bir [0, 1) değeri.
  let t = ((seed ^ Math.imul(sol, 0x9e3779b1)) + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function randomSeed(): number {
  return (Math.floor(Math.random() * 0x100000000) ^ Date.now()) >>> 0
}

// ---------------------------------------------------------------------------
// Kart seçimi

function pickRandom(pool: readonly MissionCard[], rand: number): MissionCard | null {
  if (pool.length === 0) return null
  return pool[Math.min(pool.length - 1, Math.floor(rand * pool.length))] ?? null
}

function pickOldestUsed(
  pool: readonly MissionCard[],
  usedCardIds: readonly string[],
): MissionCard | null {
  let best: MissionCard | null = null
  let bestIndex = Infinity
  for (const card of pool) {
    const i = usedCardIds.indexOf(card.id)
    if (i !== -1 && i < bestIndex) {
      best = card
      bestIndex = i
    }
  }
  return best
}

/** Önce kullanılmamışlardan rastgele, yoksa en eski kullanılandan. */
function pickUnusedThenOldest(
  pool: readonly MissionCard[],
  usedCardIds: readonly string[],
  rand: number,
): MissionCard | null {
  const unused = pool.filter((c) => !usedCardIds.includes(c.id))
  return pickRandom(unused, rand) ?? pickOldestUsed(pool, usedCardIds)
}

/**
 * Verilen sol için kart seçer. Kart listesi boş değilse her zaman bir kart döndürür.
 * Sıra:
 *   0. O sol'e bağlı NASA kartı (uygun ve kullanılmamış) öne alınır.
 *   1. act ve koşul uygun, kullanılmamış (rastgele).
 *   2. act ve koşul uygun, en eski kullanılan.
 *   3. Koşullar yok sayılır, aynı act (NASA'ya bağlı kartlar hariç).
 *   4. Herhangi bir kart.
 * Önceki solün kartı, başka seçenek olduğu sürece yeniden seçilmez.
 */
export function pickCard(
  cards: readonly MissionCard[],
  sol: number,
  flags: readonly string[],
  usedCardIds: readonly string[],
  previousCardId: string | null,
  seed: number,
  nasaEvents: readonly NasaEvent[] = NO_EVENTS,
): MissionCard | null {
  const rand = randomFor(seed, sol)
  const isUnused = (c: MissionCard): boolean => !usedCardIds.includes(c.id)
  const notPrevious = (c: MissionCard): boolean => c.id !== previousCardId

  const eligible = cards.filter((c) => isCardEligible(c, sol, flags, nasaEvents))

  const nasaNow = eligible.filter((c) => isNasaLinkedCard(c) && isUnused(c))
  const tier0 = pickRandom(nasaNow, rand)
  if (tier0) return tier0

  const tier1 = pickRandom(eligible.filter(isUnused), rand)
  if (tier1) return tier1

  const tier2 = pickOldestUsed(eligible.filter(notPrevious), usedCardIds)
  if (tier2) return tier2

  const act = actForSol(sol)
  const sameAct = cards.filter((c) => c.act === act && !isNasaLinkedCard(c) && notPrevious(c))
  const tier3 = pickUnusedThenOldest(sameAct, usedCardIds, rand)
  if (tier3) return tier3

  const tier4 = pickUnusedThenOldest(cards.filter(notPrevious), usedCardIds, rand)
  if (tier4) return tier4

  // Tek kart kaldıysa art arda gelmesi kaçınılmaz.
  return cards[0] ?? null
}

/** Kartı usedCardIds'in sonuna ekler ya da sona taşır. */
function markUsed(usedCardIds: readonly string[], cardId: string): string[] {
  return [...usedCardIds.filter((id) => id !== cardId), cardId]
}

// ---------------------------------------------------------------------------
// Dış API

export function createGame(
  cards: readonly MissionCard[],
  nasaEvents: readonly NasaEvent[] = NO_EVENTS,
  config: GameConfig = DEFAULT_CONFIG,
  seed?: number,
): GameState {
  if (cards.length === 0) {
    throw new Error('createGame: kart listesi boş. Oyunu başlatmak için en az bir MissionCard gerekli.')
  }
  const finalSeed = seed !== undefined && Number.isFinite(seed) ? seed >>> 0 : randomSeed()
  const resources = applyEffects(config.startResources, {})
  const base: GameState = {
    sol: 1,
    resources,
    status: 'playing',
    flags: [],
    pending: [],
    history: [],
    currentCardId: null,
    usedCardIds: [],
    seed: finalSeed,
    usingTestData: computeUsingTestData(cards, nasaEvents),
  }

  const failed = findFailedResource(resources)
  if (failed) return { ...base, status: 'lost', failedResource: failed }

  const card = pickCard(cards, 1, [], [], null, finalSeed, nasaEvents)
  if (!card) {
    // cards boş değilken ulaşılamaz.
    throw new Error('createGame: kart seçilemedi.')
  }
  return { ...base, currentCardId: card.id, usedCardIds: [card.id] }
}

export function getCurrentCard(state: GameState, cards: readonly MissionCard[]): MissionCard | null {
  if (state.currentCardId === null) return null
  return cards.find((c) => c.id === state.currentCardId) ?? null
}

/**
 * Oyuncunun seçimini işler ve yeni state döndürür. Girdiyi değiştirmez.
 * Oyun bitmişse, seçim geçersizse ya da mevcut kart bulunamazsa aynı state'i döndürür.
 */
export function choose(
  state: GameState,
  cards: readonly MissionCard[],
  choiceId: 'a' | 'b',
  nasaEvents: readonly NasaEvent[] = NO_EVENTS,
  config: GameConfig = DEFAULT_CONFIG,
): GameState {
  if (state.status !== 'playing') return state
  if (choiceId !== 'a' && choiceId !== 'b') return state
  const card = getCurrentCard(state, cards)
  if (!card) return state
  const choice = card.choices.find((c) => c.id === choiceId)
  if (!choice) return state

  const sol = state.sol

  // b. Anlık etkiler, bayraklar, gecikmeli etkiler.
  let resources = applyEffects(state.resources, choice.effects)
  const flags = [...state.flags]
  for (const flag of choice.setFlags ?? []) {
    if (!flags.includes(flag)) flags.push(flag)
  }
  const added: PendingEffect[] = (choice.delayed ?? []).map((d) => ({
    dueSol: sol + d.afterSols,
    effects: { ...d.effects },
    message: d.message,
    fromCardId: card.id,
  }))
  let pending: PendingEffect[] = [...state.pending, ...added]

  const entry: HistoryEntry = {
    sol,
    cardId: card.id,
    choiceId,
    applied: { ...choice.effects },
    delayedApplied: [],
    resourcesAfter: resources,
  }

  const ended = (
    status: 'won' | 'lost',
    finalSol: number,
    failedResource: ResourceKey | undefined,
  ): GameState => {
    const next: GameState = {
      ...state,
      sol: finalSol,
      resources,
      status,
      flags,
      pending,
      history: [...state.history, entry],
      currentCardId: null,
    }
    if (failedResource) next.failedResource = failedResource
    return next
  }

  // c. Kayıp kontrolü (kazançtan önce).
  const failedNow = findFailedResource(resources)
  if (failedNow) return ended('lost', sol, failedNow)

  // d. Son sol tamamlandı.
  if (sol >= config.totalSols) return ended('won', sol, undefined)

  // e. Yeni sol başı: vadesi gelen gecikmeli etkiler ve dailyDrain birlikte, tek sınırlama.
  const nextSol = sol + 1
  const due = pending.filter((p) => p.dueSol <= nextSol)
  pending = pending.filter((p) => p.dueSol > nextSol)
  resources = applyEffects(resources, sumEffects([...due.map((p) => p.effects), config.dailyDrain]))
  entry.delayedApplied = due.map((p) => ({ message: p.message, effects: { ...p.effects } }))
  entry.resourcesAfter = resources

  const failedAtStart = findFailedResource(resources)
  if (failedAtStart) return ended('lost', nextSol, failedAtStart)

  // f. Yeni kart.
  const nextCard = pickCard(cards, nextSol, flags, state.usedCardIds, card.id, state.seed, nasaEvents)
  // Mevcut kart listede olduğu için nextCard null olamaz; yine de güvenli dal.
  const nextCardId = nextCard ? nextCard.id : card.id

  return {
    ...state,
    sol: nextSol,
    resources,
    status: 'playing',
    flags,
    pending,
    history: [...state.history, entry],
    currentCardId: nextCardId,
    usedCardIds: markUsed(state.usedCardIds, nextCardId),
  }
}
