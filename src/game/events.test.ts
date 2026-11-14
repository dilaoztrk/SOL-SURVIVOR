import { describe, expect, it } from 'vitest'
import {
  actForSol,
  computeUsingTestData,
  findLinkedEvent,
  flagConditionsMet,
  isCardEligible,
  isNasaCardActive,
  solConditionsMet,
} from './events.ts'
import { makeTestCard, TEST_EVENT_1, TEST_NASA_EVENTS } from './__fixtures__/test-cards.ts'

describe('actForSol', () => {
  it.each([
    [1, 1],
    [10, 1],
    [11, 2],
    [20, 2],
    [21, 3],
    [30, 3],
  ])('Sol %d -> act %d', (sol, act) => {
    expect(actForSol(sol)).toBe(act)
  })
})

describe('koşullar', () => {
  it('requiresFlags ve excludesFlags', () => {
    const card = makeTestCard('c', 1, { condition: { requiresFlags: ['x', 'y'], excludesFlags: ['z'] } })
    expect(flagConditionsMet(card, [])).toBe(false)
    expect(flagConditionsMet(card, ['x'])).toBe(false)
    expect(flagConditionsMet(card, ['x', 'y'])).toBe(true)
    expect(flagConditionsMet(card, ['x', 'y', 'z'])).toBe(false)
  })

  it('minSol ve maxSol sınırları dahildir', () => {
    const card = makeTestCard('c', 1, { condition: { minSol: 3, maxSol: 5 } })
    expect([2, 3, 5, 6].map((s) => solConditionsMet(card, s))).toEqual([false, true, true, false])
  })

  it('koşulsuz kart yalnız kendi act aralığında uygundur', () => {
    const card = makeTestCard('c', 2)
    expect(isCardEligible(card, 10, [], [])).toBe(false)
    expect(isCardEligible(card, 11, [], [])).toBe(true)
    expect(isCardEligible(card, 21, [], [])).toBe(false)
  })
})

describe('NASA eşleştirme', () => {
  const nasaCard = makeTestCard('n', 1, { condition: { nasaEventId: TEST_EVENT_1 } })

  it('bağlı olayı bulur', () => {
    expect(findLinkedEvent(nasaCard, TEST_NASA_EVENTS)?.id).toBe(TEST_EVENT_1)
    expect(findLinkedEvent(nasaCard, [])).toBeNull()
    expect(findLinkedEvent(makeTestCard('x', 1), TEST_NASA_EVENTS)).toBeNull()
  })

  it('yalnız olayın sol’ünde etkin ve uygun', () => {
    // TEST_EVENT_1 Sol 5'te.
    expect(isNasaCardActive(nasaCard, 5, TEST_NASA_EVENTS)).toBe(true)
    expect(isNasaCardActive(nasaCard, 4, TEST_NASA_EVENTS)).toBe(false)
    expect(isCardEligible(nasaCard, 5, [], TEST_NASA_EVENTS)).toBe(true)
    expect(isCardEligible(nasaCard, 6, [], TEST_NASA_EVENTS)).toBe(false)
    expect(isCardEligible(nasaCard, 5, [], [])).toBe(false)
  })

  it('science.nasaEventId eşleştirmede kullanılmaz', () => {
    const card = makeTestCard('s', 1, {
      science: { text: '[TEST] t', sourceTitle: '[TEST] s', sourceUrl: 'https://example.invalid/test', nasaEventId: TEST_EVENT_1 },
    })
    // Normal kart gibi davranır: act 1 sollerinde uygun, olayın sol'üne bağlı değil.
    expect(isCardEligible(card, 1, [], TEST_NASA_EVENTS)).toBe(true)
    expect(isCardEligible(card, 3, [], TEST_NASA_EVENTS)).toBe(true)
  })
})

describe('computeUsingTestData', () => {
  it('kart ya da olaylardan biri test ise true', () => {
    const finalCard = { ...makeTestCard('f', 1), origin: 'final' as const }
    expect(computeUsingTestData([finalCard], [])).toBe(false)
    expect(computeUsingTestData([finalCard, makeTestCard('t', 1)], [])).toBe(true)
    expect(computeUsingTestData([finalCard], TEST_NASA_EVENTS)).toBe(true)
    expect(computeUsingTestData([finalCard], [{ ...TEST_NASA_EVENTS[0]!, origin: 'donki' }])).toBe(false)
  })
})
