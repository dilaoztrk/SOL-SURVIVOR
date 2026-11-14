import type {
  GameConfig,
  GameState,
  HistoryEntry,
  MissionCard,
  NasaEvent,
  PendingEffect,
  ResourceKey,
  Resources,
} from '../types/game.ts'
import { DEFAULT_CONFIG, RESOURCE_KEYS, RESOURCE_MAX, RESOURCE_MIN } from './engine.ts'
import { computeUsingTestData } from './events.ts'

export const SAVE_VERSION = 1
export const STORAGE_KEY = `sol-survivor:game:v${SAVE_VERSION}`

interface SaveFile {
  version: number
  state: GameState
}

// ---------------------------------------------------------------------------
// localStorage erişimi: her çağrı try/catch içinde, yoksa ya da hata verirse sessizce başarısız.

function getStorage(): Storage | null {
  try {
    const s = globalThis.localStorage
    return s ?? null
  } catch {
    return null
  }
}

/** State'i kaydeder. Başarılıysa true. */
export function saveGame(state: GameState): boolean {
  try {
    const storage = getStorage()
    if (!storage) return false
    const file: SaveFile = { version: SAVE_VERSION, state }
    storage.setItem(STORAGE_KEY, JSON.stringify(file))
    return true
  } catch {
    return false
  }
}

/** Kaydı yükler. Kayıt yoksa, bozuksa ya da sürümü farklıysa null. */
export function loadGame(): GameState | null {
  try {
    const storage = getStorage()
    if (!storage) return null
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== SAVE_VERSION) return null
    return isGameState(parsed.state) ? parsed.state : null
  } catch {
    return null
  }
}

/** Kaydı siler. */
export function clearGame(): void {
  try {
    getStorage()?.removeItem(STORAGE_KEY)
  } catch {
    // Erişilemiyorsa yapılacak bir şey yok.
  }
}

// ---------------------------------------------------------------------------
// Uyumluluk: yapısal olarak geçerli bir kaydın güncel veriyle devam edip edemeyeceği.

/**
 * Yüklenen state güncel kart, olay ve ayarlarla sürdürülebilir mi?
 * Uyumsuz: currentCardId kartlarda yok (oyun sürerken null da uyumsuz); usingTestData güncel
 * veriden hesaplanan değerden farklı; sol ya da kaynaklar aralık dışında.
 */
export function isSaveCompatible(
  state: GameState,
  cards: readonly MissionCard[],
  nasaEvents: readonly NasaEvent[] = [],
  config: GameConfig = DEFAULT_CONFIG,
): boolean {
  if (state.currentCardId === null) {
    if (state.status === 'playing') return false
  } else if (!cards.some((c) => c.id === state.currentCardId)) {
    return false
  }
  if (state.usingTestData !== computeUsingTestData(cards, nasaEvents)) return false
  if (!Number.isInteger(state.sol) || state.sol < 1 || state.sol > config.totalSols) return false
  return RESOURCE_KEYS.every((key) => {
    const v = state.resources[key]
    return v >= RESOURCE_MIN && v <= RESOURCE_MAX
  })
}

// ---------------------------------------------------------------------------
// Yapı denetimi (JSON'dan gelen unknown -> GameState)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isResourceKey(value: unknown): value is ResourceKey {
  return typeof value === 'string' && (RESOURCE_KEYS as readonly string[]).includes(value)
}

function isResources(value: unknown): value is Resources {
  return isRecord(value) && RESOURCE_KEYS.every((key) => isFiniteNumber(value[key]))
}

function isEffects(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.entries(value).every(([key, v]) => isResourceKey(key) && isFiniteNumber(v))
  )
}

function isPendingEffect(value: unknown): value is PendingEffect {
  return (
    isRecord(value) &&
    isFiniteNumber(value.dueSol) &&
    isEffects(value.effects) &&
    typeof value.message === 'string' &&
    typeof value.fromCardId === 'string'
  )
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  return (
    isRecord(value) &&
    isFiniteNumber(value.sol) &&
    typeof value.cardId === 'string' &&
    (value.choiceId === 'a' || value.choiceId === 'b') &&
    isEffects(value.applied) &&
    Array.isArray(value.delayedApplied) &&
    value.delayedApplied.every(
      (d: unknown) => isRecord(d) && typeof d.message === 'string' && isEffects(d.effects),
    ) &&
    isResources(value.resourcesAfter)
  )
}

function isGameState(value: unknown): value is GameState {
  return (
    isRecord(value) &&
    isFiniteNumber(value.sol) &&
    isResources(value.resources) &&
    (value.status === 'playing' || value.status === 'won' || value.status === 'lost') &&
    (value.failedResource === undefined || isResourceKey(value.failedResource)) &&
    isStringArray(value.flags) &&
    Array.isArray(value.pending) &&
    value.pending.every(isPendingEffect) &&
    Array.isArray(value.history) &&
    value.history.every(isHistoryEntry) &&
    (value.currentCardId === null || typeof value.currentCardId === 'string') &&
    isStringArray(value.usedCardIds) &&
    isFiniteNumber(value.seed) &&
    typeof value.usingTestData === 'boolean'
  )
}
