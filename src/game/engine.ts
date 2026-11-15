import type {
  Effects,
  GameConfig,
  GameState,
  HistoryEntry,
  MissionCard,
  NasaEvent,
  MissionSpecialEventChoice,
  MissionSpecialEventId,
  MissionSpecialEventState,
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

export function createInitialSpecialEventState(): MissionSpecialEventState {
  return {
    activeEventId: null,
    appliedKeys: [],
    panelCleaning: 'not-addressed',
    quakeRepair: 'not-addressed',
    history: [],
  }
}

export function resumeCurrentSolSpecialEvent(state: GameState): GameState {
  if (state.status !== 'playing' || state.specialEvents.activeEventId !== null) return state
  const start = processSolStart(state.sol, state.specialEvents, state.flags, state.usingTestData)
  if (start.state === state.specialEvents) return state
  const resources = applyEffects(state.resources, start.effects)
  const specialEvents = updateEventResourcesForSol(start.state, state.sol, resources)
  const failedResource = findFailedResource(resources)
  return {
    ...state,
    resources,
    specialEvents,
    ...(failedResource ? { status: 'lost' as const, failedResource, currentCardId: null } : {}),
  }
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

function processSolStart(
  sol: number,
  state: MissionSpecialEventState,
  flags: readonly string[],
  usingTestData: boolean,
): { effects: Effects; state: MissionSpecialEventState } {
  if (usingTestData) return { effects: {}, state }
  const events: { id: MissionSpecialEventId; effects: Effects; activate?: boolean }[] = []
  if (sol >= 8 && sol <= 10) {
    events.push({ id: 'dust-storm', effects: { energy: -2, ...(sol === 8 ? { food: -3 } : {}) }, activate: sol === 8 })
  }
  if (sol === 11) events.push({ id: 'panel-cleaning', effects: {}, activate: true })
  if (sol === 16) {
    events.push({ id: 'solar-particles', effects: { radiationShield: flags.includes('sol-02-choice-b') ? -5 : -8 }, activate: true })
  }
  if (sol >= 12 && sol <= 18 && state.panelCleaning === 'deferred') {
    events.push({ id: 'panel-cleaning', effects: { energy: -2 } })
  }
  if (sol === 19) events.push({ id: 'wind-cleaning', effects: { energy: 4 }, activate: true })
  if (sol === 21) events.push({ id: 'meteor-archive', effects: {}, activate: true })
  if (sol === 23) events.push({ id: 'mars-quake', effects: { lifeSupport: -3, radiationShield: -4 }, activate: true })
  if (sol >= 24 && sol <= 30 && state.quakeRepair === 'deferred') {
    events.push({ id: 'mars-quake', effects: { lifeSupport: -1 } })
  }

  let next = sol === 19 ? { ...state, panelCleaning: 'wind-cleaned' as const } : state
  const applied: Effects[] = []
  for (const event of events) {
    const key = `${event.id}:${sol}`
    if (next.appliedKeys.includes(key)) continue
    applied.push(event.effects)
    next = {
      ...next,
      activeEventId: event.activate ? event.id : next.activeEventId,
      appliedKeys: [...next.appliedKeys, key],
      history: [...next.history, { sol, eventId: event.id, applied: { ...event.effects }, resourcesAfter: { energy: 0, food: 0, lifeSupport: 0, radiationShield: 0 } }],
    }
  }
  return { effects: sumEffects(applied), state: next }
}

function updateEventResourcesForSol(state: MissionSpecialEventState, sol: number, resources: Resources): MissionSpecialEventState {
  if (!state.history.some((entry) => entry.sol === sol)) return state
  const history = state.history.map((entry) => entry.sol === sol ? { ...entry, resourcesAfter: resources } : entry)
  return { ...state, history }
}

function updateActiveEventHistory(
  state: MissionSpecialEventState,
  sol: number,
  eventId: MissionSpecialEventId,
  choice: MissionSpecialEventChoice,
  effects: Effects,
  resources: Resources,
): MissionSpecialEventState {
  const index = state.history.findLastIndex((entry) => entry.sol === sol && entry.eventId === eventId)
  if (index < 0) return state
  const history = [...state.history]
  const previous = history[index]
  if (!previous) return state
  history[index] = {
    ...previous,
    choice,
    applied: sumEffects([previous.applied, effects]),
    resourcesAfter: resources,
  }
  return { ...state, history }
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
    specialEvents: createInitialSpecialEventState(),
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

export function acknowledgeSpecialEvent(state: GameState): GameState {
  const eventId = state.specialEvents.activeEventId
  if (state.status !== 'playing' || eventId === null) return state
  const latest = state.specialEvents.history.findLast((entry) => entry.sol === state.sol && entry.eventId === eventId)
  const specialEvents = latest?.choice
    ? { ...state.specialEvents, activeEventId: null }
    : updateActiveEventHistory(state.specialEvents, state.sol, eventId, 'continue', {}, state.resources)
  return { ...state, specialEvents: { ...specialEvents, activeEventId: null } }
}

export function resolveSpecialEvent(
  state: GameState,
  choice: Exclude<MissionSpecialEventChoice, 'continue'>,
): GameState {
  const eventId = state.specialEvents.activeEventId
  if (state.status !== 'playing' || eventId === null) return state
  const latest = state.specialEvents.history.findLast((entry) => entry.sol === state.sol && entry.eventId === eventId)
  if (!latest || latest.choice) return state

  let effects: Effects = {}
  let specialEvents = state.specialEvents
  if (eventId === 'panel-cleaning') {
    if (choice !== 'clean' && choice !== 'defer') return state
    if (choice === 'clean') {
      effects = { energy: state.flags.includes('sol-05-choice-a') ? -3 : -5 }
      specialEvents = { ...specialEvents, panelCleaning: 'cleaned' }
    } else {
      effects = { energy: -2 } // Sol 11 is included in the Sol 11–18 deferred loss.
      specialEvents = { ...specialEvents, panelCleaning: 'deferred' }
    }
  } else if (eventId === 'mars-quake') {
    if (choice !== 'repair' && choice !== 'defer') return state
    if (choice === 'repair') {
      effects = { energy: -4, radiationShield: 4 }
      specialEvents = { ...specialEvents, quakeRepair: 'repaired' }
    } else {
      effects = { lifeSupport: -1 } // The source scenario explicitly includes Sol 23.
      specialEvents = { ...specialEvents, quakeRepair: 'deferred' }
    }
  } else {
    return state
  }

  const resources = applyEffects(state.resources, effects)
  specialEvents = updateActiveEventHistory(specialEvents, state.sol, eventId, choice, effects, resources)
  const failedResource = findFailedResource(resources)
  const next: GameState = { ...state, resources, specialEvents }
  if (failedResource) {
    next.status = 'lost'
    next.failedResource = failedResource
    next.currentCardId = null
  }
  return next
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
  if (state.specialEvents.activeEventId !== null) return state
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
  let specialEvents = state.specialEvents

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
      specialEvents,
      history: [...state.history, entry],
      currentCardId: null,
    }
    if (failedResource) next.failedResource = failedResource
    return next
  }

  // c. Kayıp kontrolü (kazançtan önce).
  if (sol >= config.totalSols) {
    resources = applyEffects(resources, config.dailyDrain)
    entry.resourcesAfter = resources
  }

  const failedNow = findFailedResource(resources)
  if (failedNow) return ended('lost', sol, failedNow)

  // d. Son sol tamamlandı.
  if (sol >= config.totalSols) return ended('won', sol, undefined)

  // e. Yeni sol başı: vadesi gelen gecikmeli etkiler ve dailyDrain birlikte, tek sınırlama.
  const nextSol = sol + 1
  const due = pending.filter((p) => p.dueSol <= nextSol)
  pending = pending.filter((p) => p.dueSol > nextSol)
  const eventStart = processSolStart(nextSol, specialEvents, flags, state.usingTestData)
  specialEvents = eventStart.state
  resources = applyEffects(resources, sumEffects([...due.map((p) => p.effects), config.dailyDrain, eventStart.effects]))
  specialEvents = updateEventResourcesForSol(specialEvents, nextSol, resources)
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
    specialEvents,
    history: [...state.history, entry],
    currentCardId: nextCardId,
    usedCardIds: markUsed(state.usedCardIds, nextCardId),
  }
}
