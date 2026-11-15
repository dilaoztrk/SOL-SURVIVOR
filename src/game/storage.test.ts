import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameState } from '../types/game.ts'
import { createGame, DEFAULT_CONFIG } from './engine.ts'
import {
  clearGame,
  isSaveCompatible,
  loadGame,
  SAVE_VERSION,
  saveGame,
  STORAGE_KEY,
} from './storage.ts'
import { play, safePolicy } from './__fixtures__/play.ts'
import { TEST_CARDS, TEST_NASA_EVENTS } from './__fixtures__/test-cards.ts'

/** jsdom olmadan, bellek içi sahte localStorage. */
function createMemoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string): string | null => data.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      data.set(key, String(value))
    },
    removeItem: (key: string): void => {
      data.delete(key)
    },
  }
}

let storage = createMemoryStorage()

beforeEach(() => {
  storage = createMemoryStorage()
  vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function midGame(): GameState {
  const start = createGame(TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, 5)
  return play(start, TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, safePolicy, 8)
}

describe('saveGame / loadGame / clearGame', () => {
  it('anahtar sürümlüdür', () => {
    expect(STORAGE_KEY).toContain(`v${SAVE_VERSION}`)
  })

  it('kaydedilen state aynen geri yüklenir', () => {
    const s = midGame()
    expect(saveGame(s)).toBe(true)
    expect(storage.data.has(STORAGE_KEY)).toBe(true)
    expect(loadGame()).toEqual(s)
  })

  it('kayıt yoksa null', () => {
    expect(loadGame()).toBeNull()
  })

  it('clearGame kaydı siler', () => {
    saveGame(midGame())
    clearGame()
    expect(storage.data.has(STORAGE_KEY)).toBe(false)
    expect(loadGame()).toBeNull()
  })

  it.each([
    ['bozuk JSON', '{bu json değil'],
    ['eski sürüm', JSON.stringify({ version: SAVE_VERSION - 1, state: {} })],
    ['sürümsüz', JSON.stringify({ state: {} })],
    ['null', 'null'],
    ['dizi', '[]'],
    ['state eksik', JSON.stringify({ version: SAVE_VERSION })],
  ])('%s kayıtta null', (_name, raw) => {
    storage.data.set(STORAGE_KEY, raw)
    expect(loadGame()).toBeNull()
  })

  it('eski sürümle kaydedilmiş geçerli state de reddedilir', () => {
    storage.data.set(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION + 1, state: midGame() }))
    expect(loadGame()).toBeNull()
  })

  it.each([
    ['kaynak sayı değil', (s: Record<string, unknown>) => ({ ...s, resources: { energy: 'x' } })],
    ['status geçersiz', (s: Record<string, unknown>) => ({ ...s, status: 'paused' })],
    ['flags dizi değil', (s: Record<string, unknown>) => ({ ...s, flags: 'x' })],
    ['history bozuk', (s: Record<string, unknown>) => ({ ...s, history: [{ sol: 1 }] })],
    ['pending bozuk', (s: Record<string, unknown>) => ({ ...s, pending: [{ dueSol: 'x' }] })],
    ['usingTestData eksik', (s: Record<string, unknown>) => ({ ...s, usingTestData: undefined })],
    ['seed eksik', (s: Record<string, unknown>) => ({ ...s, seed: undefined })],
    ['failedResource geçersiz', (s: Record<string, unknown>) => ({ ...s, failedResource: 'oxygen' })],
  ])('yapısı bozuk state null: %s', (_name, corrupt) => {
    const state = JSON.parse(JSON.stringify(midGame())) as Record<string, unknown>
    storage.data.set(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, state: corrupt(state) }))
    expect(loadGame()).toBeNull()
  })

  it('localStorage hata fırlatırsa çökmez', () => {
    const boom = (): never => {
      throw new Error('erişim yok')
    }
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom })
    expect(saveGame(midGame())).toBe(false)
    expect(loadGame()).toBeNull()
    expect(() => clearGame()).not.toThrow()
  })

  it('localStorage yoksa çökmez', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(saveGame(midGame())).toBe(false)
    expect(loadGame()).toBeNull()
    expect(() => clearGame()).not.toThrow()
  })
})

describe('isSaveCompatible', () => {
  const cards = TEST_CARDS
  const events = TEST_NASA_EVENTS

  it('güncel veriyle oynanan state uyumludur', () => {
    expect(isSaveCompatible(midGame(), cards, events)).toBe(true)
  })

  it('bitmiş oyun (kart null) uyumludur', () => {
    const end = play(createGame(cards, events, DEFAULT_CONFIG, 5), cards, events)
    expect(end.currentCardId).toBeNull()
    expect(isSaveCompatible(end, cards, events)).toBe(true)
  })

  it('currentCardId kartlarda yoksa uyumsuz', () => {
    expect(isSaveCompatible({ ...midGame(), currentCardId: 'silinmis-kart' }, cards, events)).toBe(false)
    const s = midGame()
    expect(isSaveCompatible(s, cards.filter((c) => c.id !== s.currentCardId), events)).toBe(false)
  })

  it('oyun sürerken currentCardId null ise uyumsuz', () => {
    expect(isSaveCompatible({ ...midGame(), currentCardId: null }, cards, events)).toBe(false)
  })

  it('usingTestData güncel veriden farklıysa uyumsuz', () => {
    const s = midGame()
    expect(s.usingTestData).toBe(true)
    // Ekip gerçek veriye geçtiğinde eski test kaydı devam etmemeli.
    const finalCards = cards.map((c) => ({ ...c, origin: 'final' as const }))
    expect(isSaveCompatible(s, finalCards, [])).toBe(false)
    expect(isSaveCompatible({ ...s, usingTestData: false }, cards, events)).toBe(false)
  })

  it.each([0, 31, 1.5, -3])('sol aralık dışındaysa uyumsuz: %d', (sol) => {
    expect(isSaveCompatible({ ...midGame(), sol }, cards, events)).toBe(false)
  })

  it.each([101, -1])('kaynak aralık dışındaysa uyumsuz: %d', (value) => {
    const s = midGame()
    expect(isSaveCompatible({ ...s, resources: { ...s.resources, food: value } }, cards, events)).toBe(false)
  })

  it('sol sınırı config.totalSols’dan gelir', () => {
    const s = { ...midGame(), sol: 9 }
    expect(isSaveCompatible(s, cards, events, { ...DEFAULT_CONFIG, totalSols: 8 })).toBe(false)
    expect(isSaveCompatible(s, cards, events, { ...DEFAULT_CONFIG, totalSols: 9 })).toBe(true)
  })
})
