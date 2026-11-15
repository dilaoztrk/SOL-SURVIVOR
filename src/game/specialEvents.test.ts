import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameConfig, GameState, Resources } from '../types/game.ts'
import { acknowledgeSpecialEvent, choose, createGame, createInitialSpecialEventState, DEFAULT_CONFIG, getCurrentCard, resolveSpecialEvent, resumeCurrentSolSpecialEvent } from './engine.ts'
import { loadGame, SAVE_VERSION, saveGame, STORAGE_KEY } from './storage.ts'
import { missionCardForSol, missionCards } from './data/missionCards.ts'

const EVENT_CONFIG: GameConfig = {
  ...DEFAULT_CONFIG,
  startResources: { energy: 80, food: 75, lifeSupport: 85, radiationShield: 70 },
  dailyDrain: { food: -1 },
}

function atSol(sol: number, resources: Resources = EVENT_CONFIG.startResources, flags: string[] = []): GameState {
  const firstChoiceWasA = flags.includes('sol-01-choice-a')
  const card = missionCardForSol(sol, firstChoiceWasA)
  if (!card) throw new Error(`Sol ${sol} kartı bulunamadı`)
  return {
    ...createGame(missionCards, [], EVENT_CONFIG, 41),
    sol,
    resources,
    flags,
    currentCardId: card.id,
    usedCardIds: [card.id],
    history: [],
    pending: [],
    specialEvents: createInitialSpecialEventState(),
  }
}

function applyDailyChoice(state: GameState, choice: 'a' | 'b' = 'b'): GameState {
  return choose(state, missionCards, choice, [], EVENT_CONFIG)
}

function ackIfActive(state: GameState): GameState {
  return state.specialEvents.activeEventId ? acknowledgeSpecialEvent(state) : state
}

afterEach(() => vi.unstubAllGlobals())

describe('Beyza special Mars events', () => {
  it('applies the Sol 8–10 storm once per Sol, with the single Food loss on Sol 8', () => {
    let state = applyDailyChoice(atSol(7, { energy: 80, food: 75, lifeSupport: 85, radiationShield: 70 }), 'a')
    expect(state.sol).toBe(8)
    expect(state.specialEvents.activeEventId).toBe('dust-storm')
    expect(state.resources).toEqual({ energy: 71, food: 68, lifeSupport: 85, radiationShield: 70 })
    expect(applyDailyChoice(state, 'a')).toBe(state) // No daily card can be chosen before the event is closed.

    state = acknowledgeSpecialEvent(state)
    state = applyDailyChoice(state, 'b')
    expect(state.sol).toBe(9)
    expect(state.resources.energy).toBe(69)
    expect(state.resources.food).toBe(67)
    state = applyDailyChoice(state, 'b')
    expect(state.sol).toBe(10)
    expect(state.resources.energy).toBe(67)
    expect(state.resources.food).toBe(66)
    expect(state.specialEvents.appliedKeys.filter((key) => key.startsWith('dust-storm:'))).toEqual([
      'dust-storm:8', 'dust-storm:9', 'dust-storm:10',
    ])
  })

  it('can end the mission when a Sol-start event reduces a resource to zero', () => {
    const state = applyDailyChoice(atSol(7, { energy: 8, food: 50, lifeSupport: 50, radiationShield: 50 }), 'a')
    expect(state.sol).toBe(8)
    expect(state.resources.energy).toBe(0)
    expect(state.status).toBe('lost')
    expect(state.failedResource).toBe('energy')
  })

  it('applies the Sol 11 cleaning choice and its Sol 5 A discount exactly once', () => {
    let state = applyDailyChoice(atSol(10, { energy: 50, food: 50, lifeSupport: 50, radiationShield: 50 }, ['sol-05-choice-a']))
    expect(state.specialEvents.activeEventId).toBe('panel-cleaning')
    expect(state.resources.energy).toBe(50)
    state = resolveSpecialEvent(state, 'clean')
    expect(state.resources.energy).toBe(47)
    expect(state.specialEvents.panelCleaning).toBe('cleaned')
    expect(resolveSpecialEvent(state, 'defer')).toBe(state)
    state = acknowledgeSpecialEvent(state)
    state = applyDailyChoice(state, 'b')
    expect(state.sol).toBe(12)
    expect(state.resources.energy).toBe(47)
    expect(state.specialEvents.appliedKeys).not.toContain('panel-cleaning:12')
  })

  it('charges deferred panel loss eight times from Sol 11 through Sol 18 and stops at Sol 19', () => {
    let state = applyDailyChoice(atSol(10, { energy: 60, food: 90, lifeSupport: 80, radiationShield: 80 }))
    state = resolveSpecialEvent(state, 'defer')
    expect(state.resources.energy).toBe(58) // Sol 11 is included.
    state = acknowledgeSpecialEvent(state)
    while (state.sol < 18 && state.status === 'playing') {
      state = ackIfActive(state)
      state = { ...state, resources: { ...state.resources, energy: 60, food: 90, lifeSupport: 80, radiationShield: 80 } }
      state = applyDailyChoice(state)
    }
    expect(state.sol).toBe(18)
    expect(state.specialEvents.appliedKeys.filter((key) => key.startsWith('panel-cleaning:'))).toEqual(
      Array.from({ length: 8 }, (_, index) => `panel-cleaning:${index + 11}`),
    )

    state = { ...state, resources: { ...state.resources, energy: 60 } }
    state = applyDailyChoice(state)
    expect(state.sol).toBe(19)
    expect(state.specialEvents.activeEventId).toBe('wind-cleaning')
    expect(state.specialEvents.panelCleaning).toBe('wind-cleaned')
    expect(state.resources.energy).toBe(46) // Sol 18 B's due −14, its card's −4, and wind +4; no panel drain.
    expect(state.specialEvents.appliedKeys).not.toContain('panel-cleaning:19')
  })

  it('remembers Sol 2 B and applies the reduced Sol 16 shield loss', () => {
    let state = applyDailyChoice(atSol(1), 'b')
    state = applyDailyChoice(state, 'b')
    expect(state.flags).toContain('sol-02-choice-b')

    state = applyDailyChoice(atSol(15, { energy: 80, food: 80, lifeSupport: 80, radiationShield: 50 }, state.flags))
    expect(state.specialEvents.activeEventId).toBe('solar-particles')
    expect(state.resources.radiationShield).toBe(45)
    expect(state.specialEvents.history.at(-1)?.applied).toEqual({ radiationShield: -5 })
  })

  it('applies the wind bonus once and keeps the Sol 21 archive informational', () => {
    const panelHistory = Array.from({ length: 8 }, (_, index) => `panel-cleaning:${index + 11}`)
    const at18 = {
      ...atSol(18, { energy: 60, food: 70, lifeSupport: 80, radiationShield: 80 }),
      specialEvents: { ...createInitialSpecialEventState(), panelCleaning: 'deferred' as const, appliedKeys: panelHistory },
    }
    let state = applyDailyChoice(at18)
    expect(state.resources.energy).toBe(60)
    expect(state.specialEvents.panelCleaning).toBe('wind-cleaned')
    expect(state.specialEvents.history.at(-1)?.applied).toEqual({ energy: 4 })
    state = acknowledgeSpecialEvent(state)

    state = applyDailyChoice(atSol(20, { energy: 60, food: 70, lifeSupport: 80, radiationShield: 80 }))
    expect(state.specialEvents.activeEventId).toBe('meteor-archive')
    expect(state.specialEvents.history.at(-1)?.applied).toEqual({})
    expect(state.resources.energy).toBe(60)
  })

  it('applies Sol 23 quake damage, repair cost and shield recovery through the engine', () => {
    let state = applyDailyChoice(atSol(22, { energy: 50, food: 80, lifeSupport: 30, radiationShield: 50 }), 'a')
    expect(state.specialEvents.activeEventId).toBe('mars-quake')
    expect(state.resources.lifeSupport).toBe(27)
    expect(state.resources.radiationShield).toBe(46)
    state = resolveSpecialEvent(state, 'repair')
    expect(state.resources.energy).toBe(38)
    expect(state.resources.lifeSupport).toBe(27)
    expect(state.resources.radiationShield).toBe(50)
    expect(state.specialEvents.quakeRepair).toBe('repaired')
    state = acknowledgeSpecialEvent(state)
    state = applyDailyChoice(state, 'b')
    expect(state.sol).toBe(24)
    expect(state.resources.lifeSupport).toBe(19) // Sol 23 daily card effect only; no recurring quake loss.
    expect(state.specialEvents.appliedKeys).not.toContain('mars-quake:24')
  })

  it('starts the deferred quake loss on Sol 23 and persists it on later Sols', () => {
    let state = applyDailyChoice(atSol(22, { energy: 50, food: 80, lifeSupport: 30, radiationShield: 50 }), 'b')
    expect(state.resources.lifeSupport).toBe(27)
    state = resolveSpecialEvent(state, 'defer')
    expect(state.resources.lifeSupport).toBe(26)
    state = acknowledgeSpecialEvent(state)
    state = applyDailyChoice(state, 'b')
    expect(state.sol).toBe(24)
    expect(state.resources.lifeSupport).toBe(17)
    expect(state.specialEvents.appliedKeys).toContain('mars-quake:24')
  })

  it('saves active event choices and effect history for reload', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    })
    let state = applyDailyChoice(atSol(10, { energy: 60, food: 80, lifeSupport: 80, radiationShield: 80 }))
    state = resolveSpecialEvent(state, 'defer')
    expect(saveGame(state)).toBe(true)
    expect(loadGame()).toEqual(state)
    expect(loadGame()?.specialEvents.panelCleaning).toBe('deferred')
    expect(loadGame()?.specialEvents.history.at(-1)?.choice).toBe('defer')
  })

  it('keeps older saves loadable and applies an unrecorded event at the saved current Sol once', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    })
    const legacyState: Record<string, unknown> = { ...atSol(8, { energy: 50, food: 50, lifeSupport: 80, radiationShield: 80 }) }
    delete legacyState.specialEvents
    storage.set(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, state: legacyState }))
    const loaded = loadGame()
    expect(loaded?.specialEvents.activeEventId).toBeNull()
    const resumed = resumeCurrentSolSpecialEvent(loaded as GameState)
    expect(resumed.specialEvents.activeEventId).toBe('dust-storm')
    expect(resumed.resources).toEqual({ energy: 48, food: 47, lifeSupport: 80, radiationShield: 80 })
    expect(resumeCurrentSolSpecialEvent(resumed)).toBe(resumed)
  })

  it('applies the final daily Food −1 before deciding whether Sol 30 wins', () => {
    const oneFood = atSol(30, { energy: 50, food: 1, lifeSupport: 50, radiationShield: 50 })
    const lost = applyDailyChoice(oneFood, 'a')
    expect(lost.status).toBe('lost')
    expect(lost.failedResource).toBe('food')

    const twoFood = atSol(30, { energy: 50, food: 2, lifeSupport: 50, radiationShield: 50 })
    const won = applyDailyChoice(twoFood, 'a')
    expect(won.status).toBe('won')
    expect(won.resources.food).toBe(1)
  })

  it('keeps all special events ahead of their same-Sol daily cards through Sol 30', () => {
    let state = createGame(missionCards, [], EVENT_CONFIG, 9)
    const encountered: string[] = []
    for (let guard = 0; guard < 100 && state.status === 'playing'; guard += 1) {
      if (state.specialEvents.activeEventId !== null) {
        const eventId = state.specialEvents.activeEventId
        encountered.push(eventId)
        if (eventId === 'panel-cleaning') state = resolveSpecialEvent(state, 'clean')
        else if (eventId === 'mars-quake') state = resolveSpecialEvent(state, 'repair')
        if (state.status === 'playing') state = acknowledgeSpecialEvent(state)
        continue
      }
      expect(getCurrentCard(state, missionCards)?.condition?.minSol).toBe(state.sol)
      state = { ...state, resources: { energy: 100, food: 100, lifeSupport: 100, radiationShield: 100 } }
      state = applyDailyChoice(state, 'a')
    }
    expect(state.status).toBe('won')
    expect(encountered).toEqual(['dust-storm', 'panel-cleaning', 'solar-particles', 'wind-cleaning', 'meteor-archive', 'mars-quake'])
  })
})
