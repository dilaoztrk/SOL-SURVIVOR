import { describe, expect, it } from 'vitest'
import { choose, createGame, DEFAULT_CONFIG, getCurrentCard } from '../engine.ts'
import { migrateSavedCardId } from '../storage.ts'
import { validateCards } from '../validate.ts'
import { dailyCards } from './beyzaScenario.ts'
import { missionCardForSol, missionCards } from './missionCards.ts'

const UI_CONFIG = {
  ...DEFAULT_CONFIG,
  startResources: { energy: 80, food: 75, lifeSupport: 85, radiationShield: 70 },
  dailyDrain: { food: -1 },
}

describe('Beyza daily card adapter', () => {
  it('converts all 30 source Sols to valid, uniquely identified final cards', () => {
    expect(dailyCards).toHaveLength(30)
    expect(missionCards).toHaveLength(31) // Sol 4 has two engine variants for its supported prior-choice condition.
    expect(new Set(missionCards.map((card) => card.id)).size).toBe(missionCards.length)
    expect(validateCards(missionCards).ok).toBe(true)
    for (let sol = 1; sol <= 30; sol += 1) {
      expect(missionCards.some((card) => card.condition?.minSol === sol)).toBe(true)
    }
  })

  it('preserves Sol 1 A source data and applies its actual Energy cost through the engine', () => {
    const card = missionCards.find((candidate) => candidate.condition?.minSol === 1)
    expect(card?.title).toBe(dailyCards[0]?.title)
    expect(card?.description).toBe(dailyCards[0]?.status)
    expect(card?.choices[0].label).toBe(dailyCards[0]?.options[0]?.label)
    expect(card?.choices[0].effects).toEqual({ energy: -6 })
    const sol5 = missionCards.find((candidate) => candidate.condition?.minSol === 5)
    expect(sol5?.choices[0].setFlags).toContain('sol-05-choice-a')

    let state = createGame(missionCards, [], UI_CONFIG, 1)
    state = choose(state, missionCards, 'a', [], UI_CONFIG)
    expect(state.resources).toEqual({ energy: 74, food: 74, lifeSupport: 85, radiationShield: 70 })
    expect(state.flags).toContain('sol-01-choice-a')
  })

  it('applies Sol 3 A immediately and schedules Food +14 for Sol 7', () => {
    let state = createGame(missionCards, [], UI_CONFIG, 1)
    state = choose(state, missionCards, 'a', [], UI_CONFIG) // Sol 1
    state = choose(state, missionCards, 'a', [], UI_CONFIG) // Sol 2
    expect(getCurrentCard(state, missionCards)?.condition?.minSol).toBe(3)
    state = choose(state, missionCards, 'a', [], UI_CONFIG) // Sol 3
    expect(state.resources.energy).toBe(66)
    expect(state.pending).toContainEqual(expect.objectContaining({
      dueSol: 7,
      effects: { food: 14 },
      fromCardId: 'beyza-sol-03',
    }))

    state = choose(state, missionCards, 'a', [], UI_CONFIG) // Sol 4
    state = choose(state, missionCards, 'a', [], UI_CONFIG) // Sol 5
    state = choose(state, missionCards, 'a', [], UI_CONFIG) // Sol 6; Sol 7 starts and applies the pending effect.
    expect(state.sol).toBe(7)
    expect(state.resources.food).toBe(79)
    expect(state.history.at(-1)?.delayedApplied).toContainEqual(expect.objectContaining({ effects: { food: 14 } }))
  })

  it('uses supported Sol 1 flags to preserve both Sol 4 conditional outcomes', () => {
    const afterA = missionCardForSol(4, true)
    const afterB = missionCardForSol(4, false)
    expect(afterA?.choices[0].effects).toEqual({ energy: -4, lifeSupport: -3 })
    expect(afterA?.choices[1].delayed).toEqual([
      { afterSols: 4, effects: { lifeSupport: -8 }, message: 'Gecikmeli etki — Sol 8: Life Support −8' },
    ])
    expect(afterB?.choices[0].effects).toEqual({ energy: -4, lifeSupport: -6 })
    expect(afterB?.choices[1].delayed?.[0]?.effects).toEqual({ lifeSupport: -12 })
  })

  it('migrates an older Sol 4 save ID to the variant selected by Sol 1 flags', () => {
    const oldSave = { ...createGame(missionCards, [], UI_CONFIG, 1), sol: 4, currentCardId: 'beyza-sol-04', flags: ['sol-01-choice-a'] }
    expect(migrateSavedCardId(oldSave, missionCards).currentCardId).toBe('beyza-sol-04-after-sol-1-a')
  })

  it('ends the mission when an engine-applied choice reduces a resource to zero', () => {
    const config = { ...DEFAULT_CONFIG, startResources: { ...DEFAULT_CONFIG.startResources, energy: 6 } }
    const state = choose(createGame(missionCards, [], config, 1), missionCards, 'a', [], config)
    expect(state.status).toBe('lost')
    expect(state.failedResource).toBe('energy')
  })

  it('wins when the Sol 30 decision is completed with resources remaining', () => {
    const state = createGame(missionCards, [], DEFAULT_CONFIG, 1)
    const sol30 = missionCardForSol(30, false)
    if (!sol30) throw new Error('Sol 30 card is missing')
    const atSol30 = { ...state, sol: 30, currentCardId: sol30.id, resources: { energy: 100, food: 100, lifeSupport: 100, radiationShield: 100 } }
    expect(choose(atSol30, missionCards, 'a').status).toBe('won')
  })
})
