import { describe, expect, it } from 'vitest'
import type { GameConfig, GameState, MissionCard } from '../types/game.ts'
import { choose, createGame, DEFAULT_CONFIG, getCurrentCard } from './engine.ts'
import { actForSol, isNasaLinkedCard } from './events.ts'
import { alwaysA, alwaysB, play, safePolicy } from './__fixtures__/play.ts'
import type { Policy } from './__fixtures__/play.ts'
import {
  makeTestCard,
  TEST_CARDS,
  TEST_EVENT_1,
  TEST_FLAG,
  TEST_NASA_EVENTS,
} from './__fixtures__/test-cards.ts'

const NOOP_CARDS: MissionCard[] = [makeTestCard('n1', 1), makeTestCard('n2', 2), makeTestCard('n3', 3)]

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value)) deepFreeze(v)
  }
  return value
}

function withConfig(patch: Partial<GameConfig>): GameConfig {
  return { ...DEFAULT_CONFIG, ...patch }
}

/** Tek kartlık bir oyun başlatır; kart her sol tekrar gelir. */
function singleCardGame(card: MissionCard, config: GameConfig = DEFAULT_CONFIG): GameState {
  return createGame([card], [], config, 1)
}

describe('createGame', () => {
  it('Sol 1, kaynaklar 70, act 1 kartı ile başlar', () => {
    const s = createGame(TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, 7)
    expect(s.sol).toBe(1)
    expect(s.status).toBe('playing')
    expect(s.resources).toEqual({ energy: 70, food: 70, lifeSupport: 70, radiationShield: 70 })
    expect(s.flags).toEqual([])
    expect(s.pending).toEqual([])
    expect(s.history).toEqual([])
    expect(s.seed).toBe(7)
    const card = getCurrentCard(s, TEST_CARDS)
    expect(card?.act).toBe(1)
    expect(s.usedCardIds).toEqual([s.currentCardId])
  })

  it('DEFAULT_CONFIG kurallara uyar', () => {
    expect(DEFAULT_CONFIG.totalSols).toBe(30)
    expect(DEFAULT_CONFIG.startResources).toEqual({
      energy: 70,
      food: 70,
      lifeSupport: 70,
      radiationShield: 70,
    })
    expect(DEFAULT_CONFIG.dailyDrain).toEqual({
      energy: 0,
      food: 0,
      lifeSupport: 0,
      radiationShield: 0,
    })
  })

  it('boş kart listesinde anlaşılır mesajla hata fırlatır', () => {
    expect(() => createGame([])).toThrow(/kart listesi boş/)
  })

  it('seed verilmezse yine sayısal bir seed üretir', () => {
    const s = createGame(TEST_CARDS)
    expect(Number.isInteger(s.seed)).toBe(true)
    expect(s.currentCardId).not.toBeNull()
  })

  it('usingTestData: kart ya da olaylardan biri test ise true', () => {
    const finalCards = TEST_CARDS.map((c) => ({ ...c, origin: 'final' as const }))
    expect(createGame(TEST_CARDS, [], DEFAULT_CONFIG, 1).usingTestData).toBe(true)
    expect(createGame(finalCards, [], DEFAULT_CONFIG, 1).usingTestData).toBe(false)
    expect(createGame(finalCards, TEST_NASA_EVENTS, DEFAULT_CONFIG, 1).usingTestData).toBe(true)
  })
})

describe('sınırlama', () => {
  it('üst sınır 100', () => {
    const card = makeTestCard('up', 1, { a: { effects: { energy: 50, food: 100 } } })
    const s = choose(singleCardGame(card), [card], 'a')
    expect(s.resources.energy).toBe(100)
    expect(s.resources.food).toBe(100)
    expect(s.resources.lifeSupport).toBe(70)
  })

  it('alt sınır 0', () => {
    const card = makeTestCard('down', 1, { a: { effects: { energy: -100, food: -30 } } })
    const s = choose(singleCardGame(card), [card], 'a')
    expect(s.resources.energy).toBe(0)
    expect(s.resources.food).toBe(40)
  })

  it('başlangıç kaynakları da sınırlanır', () => {
    const config = withConfig({
      startResources: { energy: 150, food: 70, lifeSupport: 70, radiationShield: 70 },
    })
    expect(createGame(NOOP_CARDS, [], config, 1).resources.energy).toBe(100)
  })
})

describe('kaybetme', () => {
  it('bir kaynak 0 olunca oyun biter', () => {
    const card = makeTestCard('k', 1, { a: { effects: { lifeSupport: -70 } } })
    const start = singleCardGame(card)
    const s = choose(start, [card], 'a')
    expect(s.status).toBe('lost')
    expect(s.failedResource).toBe('lifeSupport')
    expect(s.sol).toBe(1)
    expect(s.currentCardId).toBeNull()
    expect(s.history).toHaveLength(1)
    expect(s.history[0]?.resourcesAfter.lifeSupport).toBe(0)
  })

  it.each([
    [{ food: -70, radiationShield: -70 }, 'food'],
    [{ lifeSupport: -70, radiationShield: -70 }, 'lifeSupport'],
    [{ radiationShield: -70, energy: -70 }, 'energy'],
    [{ energy: -70, food: -70, lifeSupport: -70, radiationShield: -70 }, 'energy'],
  ] as const)('aynı anda birden çok kaynak 0 ise sıra uygulanır: %o -> %s', (effects, expected) => {
    const card = makeTestCard('k', 1, { a: { effects } })
    const s = choose(singleCardGame(card), [card], 'a')
    expect(s.status).toBe('lost')
    expect(s.failedResource).toBe(expected)
  })
})

describe('kazanma', () => {
  it('30. sol tamamlanınca won, sol 30 da kalır', () => {
    const s = play(createGame(NOOP_CARDS, [], DEFAULT_CONFIG, 3), NOOP_CARDS)
    expect(s.status).toBe('won')
    expect(s.sol).toBe(30)
    expect(s.history).toHaveLength(30)
    expect(s.history.map((h) => h.sol)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
    expect(s.currentCardId).toBeNull()
    expect(s.failedResource).toBeUndefined()
  })

  it('30. solde hem kayıp hem kazanç koşulu varsa lost', () => {
    const card = makeTestCard('k', 3, { a: { effects: { energy: -100 } } })
    const atLastSol: GameState = { ...createGame([card], [], DEFAULT_CONFIG, 1), sol: 30 }
    const lost = choose(atLastSol, [card], 'a')
    expect(lost.status).toBe('lost')
    expect(lost.failedResource).toBe('energy')
    expect(lost.sol).toBe(30)

    const won = choose(atLastSol, [card], 'b')
    expect(won.status).toBe('won')
  })

  it('oyun bitince vadesi gelmemiş gecikmeli etkiler uygulanmaz', () => {
    const card = makeTestCard('k', 3)
    const atLastSol: GameState = {
      ...createGame([card], [], DEFAULT_CONFIG, 1),
      sol: 30,
      pending: [{ dueSol: 31, effects: { energy: -100 }, message: '[TEST] M', fromCardId: 'k' }],
    }
    const s = choose(atLastSol, [card], 'a')
    expect(s.status).toBe('won')
    expect(s.resources.energy).toBe(70)
    expect(s.history[0]?.delayedApplied).toEqual([])
  })
})

describe('gecikmeli etki', () => {
  const card = makeTestCard('d', 1, {
    a: {
      effects: {},
      delayed: [{ afterSols: 3, effects: { food: -10 }, message: '[TEST] Gecikmeli' }],
    },
  })

  it('afterSols sonra, doğru solün başında uygulanır ve history’ye yazılır', () => {
    const s1 = singleCardGame(card)
    const s2 = choose(s1, [card], 'a')
    expect(s2.sol).toBe(2)
    expect(s2.resources.food).toBe(70)
    expect(s2.pending).toEqual([
      { dueSol: 4, effects: { food: -10 }, message: '[TEST] Gecikmeli', fromCardId: 'd' },
    ])

    const s3 = choose(s2, [card], 'b')
    expect(s3.sol).toBe(3)
    expect(s3.resources.food).toBe(70)

    const s4 = choose(s3, [card], 'b')
    expect(s4.sol).toBe(4)
    expect(s4.resources.food).toBe(60)
    expect(s4.pending).toEqual([])

    expect(s4.history[0]?.delayedApplied).toEqual([])
    expect(s4.history[1]?.delayedApplied).toEqual([])
    expect(s4.history[2]?.delayedApplied).toEqual([
      { message: '[TEST] Gecikmeli', effects: { food: -10 } },
    ])
    expect(s4.history[2]?.resourcesAfter.food).toBe(60)
  })

  it('sol başında gecikmeli etkiyle kaybedilirse lost, kart null, mesaj history’de', () => {
    const killer = makeTestCard('dk', 1, {
      a: {
        effects: {},
        delayed: [{ afterSols: 1, effects: { energy: -100 }, message: '[TEST] Ölümcül' }],
      },
    })
    const s = choose(singleCardGame(killer), [killer], 'a')
    expect(s.status).toBe('lost')
    expect(s.sol).toBe(2)
    expect(s.failedResource).toBe('energy')
    expect(s.currentCardId).toBeNull()
    expect(s.history).toHaveLength(1)
    expect(s.history[0]?.delayedApplied).toEqual([
      { message: '[TEST] Ölümcül', effects: { energy: -100 } },
    ])
    expect(s.history[0]?.resourcesAfter.energy).toBe(0)
  })
})

describe('dailyDrain', () => {
  it('Sol 1’de uygulanmaz, her yeni sol başında uygulanır', () => {
    const config = withConfig({ dailyDrain: { food: -2 } })
    const s1 = createGame(NOOP_CARDS, [], config, 1)
    expect(s1.resources.food).toBe(70)
    const s2 = choose(s1, NOOP_CARDS, 'a', [], config)
    expect(s2.resources.food).toBe(68)
    const s3 = choose(s2, NOOP_CARDS, 'a', [], config)
    expect(s3.resources.food).toBe(66)
    expect(s3.resources.energy).toBe(70)
  })

  it('gecikmeli etkiyle birlikte toplanır ve tek seferde sınırlanır', () => {
    const config = withConfig({
      startResources: { energy: 100, food: 70, lifeSupport: 70, radiationShield: 70 },
      dailyDrain: { energy: -10 },
    })
    const card = makeTestCard('d', 1, {
      a: { effects: {}, delayed: [{ afterSols: 1, effects: { energy: 10 }, message: '[TEST] +' }] },
    })
    // Ayrı ayrı sınırlansaydı: 100 + 10 -> 100, sonra -10 -> 90.
    const s = choose(createGame([card], [], config, 1), [card], 'a', [], config)
    expect(s.resources.energy).toBe(100)
  })

  it('sol başında drain ile kaybedilebilir', () => {
    const config = withConfig({
      startResources: { energy: 70, food: 1, lifeSupport: 70, radiationShield: 70 },
      dailyDrain: { food: -1 },
    })
    const s = choose(createGame(NOOP_CARDS, [], config, 1), NOOP_CARDS, 'a', [], config)
    expect(s.status).toBe('lost')
    expect(s.failedResource).toBe('food')
    expect(s.sol).toBe(2)
    expect(s.currentCardId).toBeNull()
  })
})

describe('bayraklar ve kart koşulları', () => {
  it('seçim bayrak bırakır, requiresFlags kartı ancak bayraktan sonra gelir', () => {
    const setter = makeTestCard('setter', 1, { a: { setFlags: ['x'] } })
    const needer = makeTestCard('needer', 1, { condition: { requiresFlags: ['x'] } })
    const cards = [setter, needer]
    const s1 = createGame(cards, [], DEFAULT_CONFIG, 99)
    expect(s1.currentCardId).toBe('setter')
    const s2 = choose(s1, cards, 'a')
    expect(s2.flags).toEqual(['x'])
    expect(s2.currentCardId).toBe('needer')
  })

  it('aynı bayrak iki kez eklenmez', () => {
    const setter = makeTestCard('setter', 1, { a: { setFlags: ['x', 'x'] } })
    const s = choose(choose(singleCardGame(setter), [setter], 'a'), [setter], 'a')
    expect(s.flags).toEqual(['x'])
  })

  it('test kartlarıyla birçok oyunda koşullar ve act aralıkları hep tutar', () => {
    let sawRequires = false
    let sawExcludes = false
    for (let seed = 0; seed < 60; seed++) {
      // Çift tohumda bayrak bırakılır, tekte bırakılmaz.
      const policy: Policy = (state, card) =>
        card.id === 'test-1b' ? (state.seed % 2 === 0 ? 'a' : 'b') : safePolicy(state, card)
      const end = play(createGame(TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, seed), TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, policy)
      expect(end.status).toBe('won')

      let flagSet = false
      for (const h of end.history) {
        const card = TEST_CARDS.find((c) => c.id === h.cardId)
        if (!card) throw new Error(`bilinmeyen kart ${h.cardId}`)
        if (!isNasaLinkedCard(card)) expect(card.act).toBe(actForSol(h.sol))
        if (h.cardId === 'test-1c') {
          expect(flagSet).toBe(true)
          sawRequires = true
        }
        if (h.cardId === 'test-2c') {
          expect(flagSet).toBe(false)
          sawExcludes = true
        }
        if (h.cardId === 'test-2d') expect(h.sol).toBeGreaterThanOrEqual(15)
        if (h.cardId === 'test-3c') expect(h.sol).toBeLessThanOrEqual(28)
        if (h.cardId === 'test-1b' && h.choiceId === 'a') flagSet = true
      }
      expect(end.flags.includes(TEST_FLAG)).toBe(flagSet)
    }
    // Test boşa geçmesin: iki koşullu kart da en az bir kez görülmeli.
    expect(sawRequires).toBe(true)
    expect(sawExcludes).toBe(true)
  })
})

describe('NASA olayı eşleştirme', () => {
  it('NASA kartı yalnız olayının sol’ünde çıkar ve o sol öne alınır', () => {
    for (let seed = 0; seed < 40; seed++) {
      const end = play(createGame(TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, seed), TEST_CARDS, TEST_NASA_EVENTS)
      expect(end.status).toBe('won')
      const solsOf = (id: string): number[] =>
        end.history.filter((h) => h.cardId === id).map((h) => h.sol)
      expect(solsOf('test-1nasa')).toEqual([5])
      expect(solsOf('test-3nasa')).toEqual([25])
    }
  })

  it('olay listesi verilmezse NASA kartları hiç çıkmaz', () => {
    for (let seed = 0; seed < 40; seed++) {
      const end = play(createGame(TEST_CARDS, [], DEFAULT_CONFIG, seed), TEST_CARDS)
      expect(end.history.some((h) => h.cardId === 'test-1nasa' || h.cardId === 'test-3nasa')).toBe(false)
    }
  })

  it('olayın sol’ü yoksa kart çıkmaz', () => {
    const events = TEST_NASA_EVENTS.map((e) => ({ ...e, sol: undefined }))
    const end = play(createGame(TEST_CARDS, events, DEFAULT_CONFIG, 5), TEST_CARDS, events)
    expect(end.history.some((h) => h.cardId === 'test-1nasa')).toBe(false)
  })

  it('act aranmaz: act 3 kartı Sol 2’deki olayla gelir', () => {
    const nasaCard = makeTestCard('late', 3, { condition: { nasaEventId: TEST_EVENT_1 } })
    const cards = [...NOOP_CARDS, nasaCard]
    const events = [{ ...TEST_NASA_EVENTS[0]!, sol: 2 }]
    const s2 = choose(createGame(cards, events, DEFAULT_CONFIG, 1), cards, 'a', events)
    expect(s2.currentCardId).toBe('late')
  })

  it('bayrak koşulu NASA kartında da aranır', () => {
    const nasaCard = makeTestCard('late', 3, {
      condition: { nasaEventId: TEST_EVENT_1, requiresFlags: ['never'] },
    })
    const cards = [...NOOP_CARDS, nasaCard]
    const events = [{ ...TEST_NASA_EVENTS[0]!, sol: 2 }]
    const s2 = choose(createGame(cards, events, DEFAULT_CONFIG, 1), cards, 'a', events)
    expect(s2.currentCardId).not.toBe('late')
  })
})

describe('tohum ve yeniden üretilebilirlik', () => {
  it('aynı tohum aynı oyunu üretir', () => {
    const run = (): GameState =>
      play(createGame(TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, 42), TEST_CARDS, TEST_NASA_EVENTS)
    expect(run()).toEqual(run())
  })

  it('farklı tohumlar farklı kart sıraları üretebilir', () => {
    const sequences = new Set<string>()
    for (let seed = 1; seed <= 5; seed++) {
      const end = play(createGame(TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, seed), TEST_CARDS, TEST_NASA_EVENTS)
      sequences.add(end.history.map((h) => h.cardId).join(','))
    }
    expect(sequences.size).toBeGreaterThan(1)
  })

  it('JSON’dan geri yüklenen state kesintisiz oyunla aynı devam eder', () => {
    const start = createGame(TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, 2024)
    const mid = play(start, TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, safePolicy, 12)
    expect(mid.sol).toBe(13)
    const restored = JSON.parse(JSON.stringify(mid)) as GameState
    const a = play(mid, TEST_CARDS, TEST_NASA_EVENTS)
    const b = play(restored, TEST_CARDS, TEST_NASA_EVENTS)
    expect(b).toEqual(a)
  })
})

describe('kartlar bitince', () => {
  function assertNoCrashNoRepeat(cards: MissionCard[], policy: Policy = alwaysA): GameState {
    const end = play(createGame(cards, [], DEFAULT_CONFIG, 11), cards, [], DEFAULT_CONFIG, policy)
    expect(end.status).toBe('won')
    expect(end.history).toHaveLength(30)
    const ids = end.history.map((h) => h.cardId)
    if (cards.length > 1) {
      for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1])
    }
    return end
  }

  it('iki kartla 30 sol oynanır, aynı kart art arda gelmez', () => {
    assertNoCrashNoRepeat([makeTestCard('x1', 1), makeTestCard('x2', 1)])
  })

  it('uygun tek kart önceki kartsa, koşulu tutmayan karta düşülür (art arda gelmez)', () => {
    const only = makeTestCard('only', 1)
    const blocked = makeTestCard('blocked', 1, { condition: { requiresFlags: ['never'] } })
    const cards = [only, blocked]
    const s1 = createGame(cards, [], DEFAULT_CONFIG, 1)
    expect(s1.currentCardId).toBe('only')
    const s2 = choose(s1, cards, 'a')
    expect(s2.currentCardId).toBe('blocked')
    const s3 = choose(s2, cards, 'a')
    expect(s3.currentCardId).toBe('only')
  })

  it('koşulu hiç tutmayan kartlarla da oynanır', () => {
    const cond = { condition: { requiresFlags: ['never'] } }
    assertNoCrashNoRepeat([makeTestCard('c1', 1, cond), makeTestCard('c2', 2, cond), makeTestCard('c3', 3, cond)])
  })

  it('yalnız eşleşmeyen NASA kartlarıyla da oynanır', () => {
    const cond = { condition: { nasaEventId: 'yok' } }
    assertNoCrashNoRepeat([makeTestCard('m1', 1, cond), makeTestCard('m2', 1, cond)])
  })

  it('tek kartla oynanır (tekrar kaçınılmaz)', () => {
    const end = assertNoCrashNoRepeat([makeTestCard('solo', 2)], alwaysB)
    expect(new Set(end.history.map((h) => h.cardId))).toEqual(new Set(['solo']))
  })

  it('yeniden kullanılan kart usedCardIds’in sonuna taşınır', () => {
    const cards = [makeTestCard('x1', 1), makeTestCard('x2', 1)]
    const end = play(createGame(cards, [], DEFAULT_CONFIG, 11), cards, [], DEFAULT_CONFIG, alwaysA, 5)
    expect(end.usedCardIds).toHaveLength(2)
    expect(end.usedCardIds[end.usedCardIds.length - 1]).toBe(end.currentCardId)
  })

  it('oyun sürerken currentCardId hiç null olmaz', () => {
    let s = createGame(TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, 8)
    while (s.status === 'playing') {
      expect(s.currentCardId).not.toBeNull()
      s = play(s, TEST_CARDS, TEST_NASA_EVENTS, DEFAULT_CONFIG, safePolicy, 1)
    }
  })
})

describe('geçersiz çağrılar', () => {
  it('bitmiş oyunda choose aynı state’i döndürür', () => {
    const end = play(createGame(NOOP_CARDS, [], DEFAULT_CONFIG, 1), NOOP_CARDS)
    expect(choose(end, NOOP_CARDS, 'a')).toBe(end)
  })

  it('geçersiz choiceId aynı state’i döndürür', () => {
    const s = createGame(TEST_CARDS, [], DEFAULT_CONFIG, 1)
    expect(choose(s, TEST_CARDS, 'c' as unknown as 'a')).toBe(s)
  })

  it('mevcut kart listede yoksa ya da liste boşsa aynı state’i döndürür', () => {
    const s = createGame(TEST_CARDS, [], DEFAULT_CONFIG, 1)
    expect(choose(s, [], 'a')).toBe(s)
    expect(choose(s, [makeTestCard('baska', 1)], 'a')).toBe(s)
    expect(getCurrentCard(s, [])).toBeNull()
  })
})

describe('saflık', () => {
  it('choose girdi state’i ve kartları değiştirmez', () => {
    const cards = deepFreeze(structuredClone(TEST_CARDS))
    const events = deepFreeze(structuredClone(TEST_NASA_EVENTS))
    let s = deepFreeze(createGame(cards, events, DEFAULT_CONFIG, 77))
    // Dondurulmuş nesnelerle 30 sol oynanır; mutasyon olsa TypeError fırlardı.
    while (s.status === 'playing') {
      const before = structuredClone(s)
      const card = getCurrentCard(s, cards)
      if (!card) throw new Error('kart yok')
      const next = choose(s, cards, safePolicy(s, card), events)
      expect(s).toEqual(before)
      s = deepFreeze(next)
    }
    expect(cards).toEqual(TEST_CARDS)
    expect(s.status).toBe('won')
  })
})
