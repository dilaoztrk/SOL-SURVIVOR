import { describe, expect, it } from 'vitest'
import { isIsoDate, isTrustedScienceUrl, validateCards, validateNasaEvents } from './validate.ts'
import { TEST_CARDS, TEST_NASA_EVENTS, TEST_SOURCE_URL } from './__fixtures__/test-cards.ts'

type Obj = Record<string, unknown>

/** Doğrulamadan hatasız geçen tek kart (düz nesne olarak, bozmak kolay olsun diye). */
function validCard(overrides: Obj = {}): Obj {
  return {
    id: 'v1',
    act: 1,
    title: '[TEST] Geçerli kart',
    description: '[TEST] Açıklama',
    choices: [
      { id: 'a', label: '[TEST] A', effects: { energy: -5 } },
      {
        id: 'b',
        label: '[TEST] B',
        effects: { food: 5 },
        delayed: [{ afterSols: 2, effects: { food: -5 }, message: '[TEST] M' }],
        setFlags: ['f'],
      },
    ],
    origin: 'test',
    ...overrides,
  }
}

function validEvent(overrides: Obj = {}): Obj {
  return {
    id: 'e1',
    type: 'TEST',
    date: '2999-01-01T00:00Z',
    summary: '[TEST] Kurgusal olay',
    sourceUrl: TEST_SOURCE_URL,
    sol: 3,
    origin: 'test',
    ...overrides,
  }
}

function choicesWith(a: Obj, b: Obj = {}): Obj[] {
  return [
    { id: 'a', label: '[TEST] A', effects: {}, ...a },
    { id: 'b', label: '[TEST] B', effects: {}, ...b },
  ]
}

function cardErrors(cards: unknown, events?: unknown): string[] {
  const r = validateCards(cards, events)
  expect(r.ok).toBe(r.errors.length === 0)
  return r.errors
}

function eventErrors(events: unknown): string[] {
  const r = validateNasaEvents(events)
  expect(r.ok).toBe(r.errors.length === 0)
  return r.errors
}

describe('geçerli örnekler', () => {
  it('test kartları ve olayları hatasız geçer, yalnız uyarı verir', () => {
    const cards = validateCards(TEST_CARDS, TEST_NASA_EVENTS)
    expect(cards.errors).toEqual([])
    expect(cards.ok).toBe(true)
    expect(cards.warnings.some((w) => w.includes("origin: 'test'"))).toBe(true)

    const events = validateNasaEvents(TEST_NASA_EVENTS)
    expect(events.errors).toEqual([])
    expect(events.ok).toBe(true)
    expect(events.warnings).toHaveLength(2)
  })

  it('tek geçerli kart ve olay', () => {
    expect(cardErrors([validCard()])).toEqual([])
    expect(eventErrors([validEvent()])).toEqual([])
    expect(validateCards([]).ok).toBe(true)
    expect(validateNasaEvents([]).ok).toBe(true)
  })
})

describe('fırlatmaz', () => {
  it.each([null, undefined, 42, 'x', {}, [null], [{}], [[]], [{ choices: 'x' }]])(
    'validateCards(%o) hata listesi döndürür',
    (input) => {
      expect(() => validateCards(input)).not.toThrow()
      const r = validateCards(input)
      expect(r.ok).toBe(false)
      expect(r.errors.length).toBeGreaterThan(0)
    },
  )

  it.each([null, undefined, 42, 'x', {}, [null], [{}]])(
    'validateNasaEvents(%o) hata listesi döndürür',
    (input) => {
      expect(() => validateNasaEvents(input)).not.toThrow()
      expect(validateNasaEvents(input).ok).toBe(false)
    },
  )

  it('olay listesi bozuk olsa da validateCards fırlatmaz', () => {
    expect(() => validateCards([validCard()], 'bozuk')).not.toThrow()
    expect(() => validateCards([validCard()], [null, 3])).not.toThrow()
  })
})

describe('kart hataları', () => {
  it.each(['id', 'act', 'title', 'description', 'choices'])('eksik zorunlu alan: %s', (field) => {
    const card = validCard()
    delete card[field]
    expect(cardErrors([card]).some((e) => e.includes(`${field}: eksik zorunlu alan`))).toBe(true)
  })

  it('seçenekte eksik zorunlu alan', () => {
    const card = validCard({ choices: [{ id: 'a', effects: {} }, { id: 'b', label: '[TEST] B' }] })
    const errors = cardErrors([card])
    expect(errors.some((e) => e.includes('choices[0].label: eksik zorunlu alan'))).toBe(true)
    expect(errors.some((e) => e.includes('choices[1].effects: eksik zorunlu alan'))).toBe(true)
  })

  it.each([1, 3])('seçenek sayısı iki değil: %d', (n) => {
    const choices = [
      { id: 'a', label: '[TEST] A', effects: {} },
      { id: 'b', label: '[TEST] B', effects: {} },
      { id: 'c', label: '[TEST] C', effects: {} },
    ].slice(0, n)
    expect(cardErrors([validCard({ choices })]).some((e) => e.includes('seçenek sayısı iki değil'))).toBe(true)
  })

  it.each([
    ['a', 'a'],
    ['a', 'c'],
    ['A', 'B'],
  ])("seçenek id'leri tam olarak 'a' ve 'b' değil: %s, %s", (first, second) => {
    const choices = [
      { id: first, label: '[TEST] 1', effects: {} },
      { id: second, label: '[TEST] 2', effects: {} },
    ]
    expect(cardErrors([validCard({ choices })]).some((e) => e.includes("tam olarak 'a' ve 'b'"))).toBe(true)
  })

  it("seçenek sırası b, a olabilir", () => {
    const choices = [
      { id: 'b', label: '[TEST] B', effects: {} },
      { id: 'a', label: '[TEST] A', effects: {} },
    ]
    expect(cardErrors([validCard({ choices })])).toEqual([])
  })

  it('tekrar eden id', () => {
    expect(cardErrors([validCard(), validCard()]).some((e) => e.includes('tekrar eden id'))).toBe(true)
  })

  it('geçersiz kaynak adı (anlık ve gecikmeli etkide)', () => {
    const immediate = validCard({ choices: choicesWith({ effects: { oxygen: 5 } }) })
    expect(cardErrors([immediate]).some((e) => e.includes('oxygen: geçersiz kaynak adı'))).toBe(true)

    const delayed = validCard({
      choices: choicesWith({
        delayed: [{ afterSols: 1, effects: { water: -5 }, message: '[TEST] M' }],
      }),
    })
    expect(cardErrors([delayed]).some((e) => e.includes('water: geçersiz kaynak adı'))).toBe(true)
  })

  it.each([['5'], [null], [Number.NaN], [Number.POSITIVE_INFINITY], [true]])(
    'etki sayı değil: %o',
    (value) => {
      const card = validCard({ choices: choicesWith({ effects: { energy: value } }) })
      expect(cardErrors([card]).some((e) => e.includes('etki sayı değil'))).toBe(true)
    },
  )

  it.each([101, -101, 1000])('etki -100..100 dışında: %d', (value) => {
    const card = validCard({ choices: choicesWith({ effects: { energy: value } }) })
    expect(cardErrors([card]).some((e) => e.includes('-100..100 dışında'))).toBe(true)
  })

  it.each([100, -100, 0])('sınırdaki etki geçerli: %d', (value) => {
    expect(cardErrors([validCard({ choices: choicesWith({ effects: { energy: value } }) })])).toEqual([])
  })

  it.each([0, 4, '1', 1.5, null])('act 1, 2, 3 değil: %o', (act) => {
    expect(cardErrors([validCard({ act })]).some((e) => e.includes('act: 1, 2 ya da 3'))).toBe(true)
  })

  it.each([0, -1])("afterSols 1'den küçük: %d", (afterSols) => {
    const card = validCard({
      choices: choicesWith({ delayed: [{ afterSols, effects: {}, message: '[TEST] M' }] }),
    })
    expect(cardErrors([card]).some((e) => e.includes("afterSols: 1'den küçük"))).toBe(true)
  })

  it('karttaki nasaEventId olay listesinde yok', () => {
    const card = validCard({ condition: { nasaEventId: 'olmayan' } })
    expect(cardErrors([card], [validEvent()]).some((e) => e.includes('olay listesinde yok'))).toBe(true)
    // Olay listesi verilmezse boş sayılır.
    expect(cardErrors([card]).some((e) => e.includes('olay listesinde yok'))).toBe(true)
    // Eşleşen olay varsa hata yok.
    expect(cardErrors([validCard({ condition: { nasaEventId: 'e1' } })], [validEvent()])).toEqual([])
  })

  it('science.nasaEventId de olay listesinde aranır', () => {
    const card = validCard({
      science: { text: '[TEST] t', sourceTitle: '[TEST] s', sourceUrl: TEST_SOURCE_URL, nasaEventId: 'olmayan' },
    })
    expect(cardErrors([card], [validEvent()]).some((e) => e.includes('science.nasaEventId'))).toBe(true)
  })

  it.each(['http://example.invalid/test', 'ftp://example.invalid/test', 'example.invalid/test'])(
    'bilim notu sourceUrl https değil: %s',
    (sourceUrl) => {
      const card = validCard({ science: { text: '[TEST] t', sourceTitle: '[TEST] s', sourceUrl } })
      expect(cardErrors([card]).some((e) => e.includes('https değil'))).toBe(true)
    },
  )

  it('bilim notunda eksik zorunlu alan', () => {
    const card = validCard({ science: { sourceUrl: TEST_SOURCE_URL } })
    const errors = cardErrors([card])
    expect(errors.some((e) => e.includes('science.text: eksik zorunlu alan'))).toBe(true)
    expect(errors.some((e) => e.includes('science.sourceTitle: eksik zorunlu alan'))).toBe(true)
  })
})

describe('kart uyarıları', () => {
  it("origin 'test' uyarıdır, hata değildir", () => {
    const r = validateCards([validCard()])
    expect(r.ok).toBe(true)
    expect(r.warnings.some((w) => w.includes("origin: 'test'"))).toBe(true)
    expect(validateCards([validCard({ origin: 'final' })]).warnings).toEqual([])
  })

  it('bilim kaynağı güvenilir alan adında değilse uyarı', () => {
    const card = validCard({
      science: { text: '[TEST] t', sourceTitle: '[TEST] s', sourceUrl: TEST_SOURCE_URL, verifiedBy: '[TEST] kişi' },
    })
    const r = validateCards([card])
    expect(r.ok).toBe(true)
    expect(r.warnings.some((w) => w.includes('nasa.gov ya da asc-csa.gc.ca'))).toBe(true)
  })

  it.each([undefined, '', '   '])('verifiedBy boşsa uyarı: %o', (verifiedBy) => {
    const card = validCard({
      science: { text: '[TEST] t', sourceTitle: '[TEST] s', sourceUrl: TEST_SOURCE_URL, verifiedBy },
    })
    const r = validateCards([card])
    expect(r.ok).toBe(true)
    expect(r.warnings.some((w) => w.includes('verifiedBy: boş'))).toBe(true)
  })

  it('alan adı denetimi alt alan adlarını kabul eder, benzer adları reddeder', () => {
    // Yalnız URL ayrıştırma birimi testi; kart verisi değildir.
    expect(isTrustedScienceUrl('https://www.nasa.gov/')).toBe(true)
    expect(isTrustedScienceUrl('https://nasa.gov/')).toBe(true)
    expect(isTrustedScienceUrl('https://www.asc-csa.gc.ca/')).toBe(true)
    expect(isTrustedScienceUrl('https://nasa.gov.example.invalid/')).toBe(false)
    expect(isTrustedScienceUrl('https://notnasa.gov/')).toBe(false)
    expect(isTrustedScienceUrl(TEST_SOURCE_URL)).toBe(false)
  })
})

describe('olay hataları', () => {
  it.each(['id', 'type', 'date', 'summary', 'sourceUrl', 'origin'])('eksik zorunlu alan: %s', (field) => {
    const event = validEvent()
    delete event[field]
    expect(eventErrors([event]).some((e) => e.includes(`${field}: eksik zorunlu alan`))).toBe(true)
  })

  it('tekrar eden id', () => {
    expect(eventErrors([validEvent(), validEvent()]).some((e) => e.includes('tekrar eden id'))).toBe(true)
  })

  it.each(['2999-13-01', '2999-02-30', '01/02/2999', '2999-1-1', 'abc', '2999-01-01T24:00Z', '2999-01-01 00:00', 20250101])(
    'date ISO biçiminde değil: %o',
    (date) => {
      expect(eventErrors([validEvent({ date })]).some((e) => e.includes('ISO biçiminde değil'))).toBe(true)
    },
  )

  it.each(['2999-01-01', '2999-01-01T00:00Z', '2999-01-01T00:00:00Z', '2999-01-01T00:00:00.000Z', '2999-01-01T00:00+03:00'])(
    'geçerli ISO tarih: %s',
    (date) => {
      expect(isIsoDate(date)).toBe(true)
      expect(eventErrors([validEvent({ date })])).toEqual([])
    },
  )

  it.each(['http://example.invalid/test', 'example.invalid', 'mailto:x@example.invalid'])(
    'sourceUrl https değil: %s',
    (sourceUrl) => {
      expect(eventErrors([validEvent({ sourceUrl })]).some((e) => e.includes('https değil'))).toBe(true)
    },
  )

  it('geçersiz origin hatadır', () => {
    expect(eventErrors([validEvent({ origin: 'internet' })]).some((e) => e.includes('origin'))).toBe(true)
  })

  it("origin 'test' uyarıdır", () => {
    const r = validateNasaEvents([validEvent()])
    expect(r.ok).toBe(true)
    expect(r.warnings.some((w) => w.includes("origin: 'test'"))).toBe(true)
    expect(validateNasaEvents([validEvent({ origin: 'donki' })]).warnings).toEqual([])
  })
})
