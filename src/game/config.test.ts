import { describe, expect, it } from 'vitest'
import { missionCards } from './data/missionCards.ts'
import { createGame } from './engine.ts'
import { MISSION_CONFIG } from './config.ts'
import { isSaveCompatible } from './storage.ts'

describe('mission GameConfig', () => {
  it('starts a new game with all four resources at 100', () => {
    expect(MISSION_CONFIG.startResources).toEqual({
      energy: 100,
      food: 100,
      lifeSupport: 100,
      radiationShield: 100,
    })
    const state = createGame(missionCards, [], MISSION_CONFIG, 123)
    expect(state.sol).toBe(1)
    expect(state.resources).toEqual(MISSION_CONFIG.startResources)
    expect(state.pending).toEqual([])
    expect(state.flags).toEqual([])
    expect(state.specialEvents.history).toEqual([])
  })

  it('keeps an existing save compatible when only the new-game starting values change', () => {
    const previousConfig = {
      ...MISSION_CONFIG,
      startResources: { energy: 80, food: 75, lifeSupport: 85, radiationShield: 70 },
    }
    const existingSave = createGame(missionCards, [], previousConfig, 321)
    expect(existingSave.resources).toEqual(previousConfig.startResources)
    expect(isSaveCompatible(existingSave, missionCards, [], MISSION_CONFIG)).toBe(true)
  })
})
