// GEÇİCİ TEST VERİSİ. Gerçek görev, tarih ya da ölçüm içermez; yalnız motor testleri içindir.
// Gerçek kartlar ve NASA verisi src/data/ altından gelecek.
import type { CardCondition, Choice, MissionCard, NasaEvent, ScienceNote } from '../../types/game.ts'

export const TEST_SOURCE_URL = 'https://example.invalid/test'
export const TEST_FLAG = 'test-flag-alpha'
export const TEST_EVENT_1 = 'test-event-1'
export const TEST_EVENT_2 = 'test-event-2'

const TEST_DESCRIPTION = '[TEST] Geçici test kartı. Gerçek içerik değildir.'

function testScience(nasaEventId?: string): ScienceNote {
  const note: ScienceNote = {
    text: '[TEST] Yer tutucu not. Bilgi içermez.',
    sourceTitle: '[TEST] Kaynak yok',
    sourceUrl: TEST_SOURCE_URL,
  }
  if (nasaEventId !== undefined) note.nasaEventId = nasaEventId
  return note
}

export interface TestCardOptions {
  a?: Partial<Omit<Choice, 'id'>>
  b?: Partial<Omit<Choice, 'id'>>
  condition?: CardCondition
  science?: ScienceNote
}

/** Testlerde kısa kart tanımı için yardımcı. Her kart origin 'test' ve "[TEST]" başlıklıdır. */
export function makeTestCard(id: string, act: 1 | 2 | 3, opts: TestCardOptions = {}): MissionCard {
  const card: MissionCard = {
    id,
    act,
    title: `[TEST] Kart ${id}`,
    description: TEST_DESCRIPTION,
    choices: [
      { id: 'a', label: '[TEST] Seçenek A', effects: {}, ...opts.a },
      { id: 'b', label: '[TEST] Seçenek B', effects: {}, ...opts.b },
    ],
    origin: 'test',
  }
  if (opts.condition) card.condition = opts.condition
  if (opts.science) card.science = opts.science
  return card
}

/** 12 test kartı: her act için 4. Etkiler küçük ve dengelidir. */
export const TEST_CARDS: MissionCard[] = [
  // Act 1
  makeTestCard('test-1a', 1, {
    a: { effects: { energy: -4, food: 4 } },
    b: { effects: { energy: 4, food: -4 } },
  }),
  makeTestCard('test-1b', 1, {
    a: { effects: { lifeSupport: -3, radiationShield: 3 }, setFlags: [TEST_FLAG] },
    b: { effects: { lifeSupport: 3, radiationShield: -3 } },
  }),
  makeTestCard('test-1c', 1, {
    a: { effects: { food: -3, lifeSupport: 3 } },
    b: { effects: { food: 3, lifeSupport: -3 } },
    condition: { requiresFlags: [TEST_FLAG] },
  }),
  makeTestCard('test-1nasa', 1, {
    a: { effects: { radiationShield: 5, energy: -5 } },
    b: { effects: { radiationShield: -5, energy: 5 } },
    condition: { nasaEventId: TEST_EVENT_1 },
    science: testScience(TEST_EVENT_1),
  }),

  // Act 2
  makeTestCard('test-2a', 2, {
    a: { effects: { energy: 3, lifeSupport: -3 } },
    b: { effects: { energy: -3, lifeSupport: 3 } },
  }),
  makeTestCard('test-2b', 2, {
    a: {
      effects: { food: 4 },
      delayed: [{ afterSols: 2, effects: { food: -4 }, message: '[TEST] Gecikmeli etki' }],
    },
    b: { effects: {} },
  }),
  makeTestCard('test-2c', 2, {
    a: { effects: { radiationShield: -3, food: 3 } },
    b: { effects: { radiationShield: 3, food: -3 } },
    condition: { excludesFlags: [TEST_FLAG] },
  }),
  makeTestCard('test-2d', 2, {
    a: { effects: { energy: -2, radiationShield: 2 } },
    b: { effects: { energy: 2, radiationShield: -2 } },
    condition: { minSol: 15 },
  }),

  // Act 3
  makeTestCard('test-3a', 3, {
    a: { effects: { lifeSupport: 4, food: -4 } },
    b: { effects: { lifeSupport: -4, food: 4 } },
  }),
  makeTestCard('test-3b', 3, {
    a: { effects: { energy: 3, radiationShield: -3 } },
    b: { effects: { energy: -3, radiationShield: 3 } },
    science: testScience(),
  }),
  makeTestCard('test-3c', 3, {
    a: { effects: { food: 2, energy: -2 } },
    b: { effects: { food: -2, energy: 2 } },
    condition: { maxSol: 28 },
  }),
  makeTestCard('test-3nasa', 3, {
    a: { effects: { radiationShield: 5, lifeSupport: -5 } },
    b: { effects: { radiationShield: -5, lifeSupport: 5 } },
    condition: { nasaEventId: TEST_EVENT_2 },
    science: testScience(TEST_EVENT_2),
  }),
]

/** 2 test olayı. Tarihler bariz kurgusaldır (2999 yılı). */
export const TEST_NASA_EVENTS: NasaEvent[] = [
  {
    id: TEST_EVENT_1,
    type: 'TEST',
    date: '2999-01-01T00:00Z',
    summary: '[TEST] Kurgusal olay. Gerçek veri değildir.',
    sourceUrl: TEST_SOURCE_URL,
    sol: 5,
    origin: 'test',
  },
  {
    id: TEST_EVENT_2,
    type: 'TEST',
    date: '2999-02-01T00:00Z',
    summary: '[TEST] Kurgusal olay. Gerçek veri değildir.',
    sourceUrl: TEST_SOURCE_URL,
    sol: 25,
    origin: 'test',
  },
]
