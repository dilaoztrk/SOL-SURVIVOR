import type { ResourceKey } from '../types/game.ts'

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const RESOURCE_NAMES: readonly ResourceKey[] = ['energy', 'food', 'lifeSupport', 'radiationShield']
const TRUSTED_SCIENCE_DOMAINS: readonly string[] = ['nasa.gov', 'asc-csa.gc.ca']
const EVENT_ORIGINS: readonly string[] = ['donki', 'radlab', 'test']
const CARD_ORIGINS: readonly string[] = ['final', 'test']

// ---------------------------------------------------------------------------
// Yardımcılar

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function describe(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

/** https ile başlayan geçerli URL mi. */
export function isHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/** URL'nin alan adı nasa.gov ya da asc-csa.gc.ca (veya alt alan adı) mı. */
export function isTrustedScienceUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return TRUSTED_SCIENCE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
  } catch {
    return false
  }
}

const ISO_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/

/**
 * ISO 8601 tarih: YYYY-MM-DD, isteğe bağlı THH:mm, :ss, .sss ve saat dilimi.
 * Saniyesiz "YYYY-MM-DDTHH:mmZ" de geçerlidir. Ay, gün, saat ve dakika aralıkları denetlenir.
 */
export function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const m = ISO_DATE.exec(value)
  if (!m) return false
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12) return false
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day < 1 || day > daysInMonth) return false
  if (m[4] !== undefined && Number(m[4]) > 23) return false
  if (m[5] !== undefined && Number(m[5]) > 59) return false
  if (m[6] !== undefined && Number(m[6]) > 59) return false
  return true
}

function validateEffects(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path}: effects nesne olmalı`)
    return
  }
  for (const [key, v] of Object.entries(value)) {
    if (!(RESOURCE_NAMES as readonly string[]).includes(key)) {
      errors.push(`${path}.${key}: geçersiz kaynak adı`)
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      errors.push(`${path}.${key}: etki sayı değil (${describe(v)})`)
    } else if (v < -100 || v > 100) {
      errors.push(`${path}.${key}: etki -100..100 dışında (${v})`)
    }
  }
}

function validateStringArray(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) return
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
    errors.push(`${path}: metin dizisi olmalı`)
  }
}

function validateOptionalNumber(value: unknown, path: string, errors: string[]): void {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
    errors.push(`${path}: sayı olmalı`)
  }
}

function validateNasaEventRef(
  value: unknown,
  path: string,
  eventIds: ReadonlySet<string>,
  errors: string[],
): void {
  if (value === undefined) return
  if (typeof value !== 'string') {
    errors.push(`${path}: metin olmalı`)
  } else if (!eventIds.has(value)) {
    errors.push(`${path}: "${value}" olay listesinde yok`)
  }
}

function validateChoice(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path}: seçenek nesne olmalı`)
    return
  }
  if (value.id === undefined) errors.push(`${path}.id: eksik zorunlu alan`)
  if (!isNonEmptyString(value.label)) errors.push(`${path}.label: eksik zorunlu alan`)
  if (value.effects === undefined) errors.push(`${path}.effects: eksik zorunlu alan`)
  else validateEffects(value.effects, `${path}.effects`, errors)

  if (value.delayed !== undefined) {
    if (!Array.isArray(value.delayed)) {
      errors.push(`${path}.delayed: dizi olmalı`)
    } else {
      value.delayed.forEach((d: unknown, j: number) => {
        const dPath = `${path}.delayed[${j}]`
        if (!isRecord(d)) {
          errors.push(`${dPath}: nesne olmalı`)
          return
        }
        if (d.afterSols === undefined) {
          errors.push(`${dPath}.afterSols: eksik zorunlu alan`)
        } else if (typeof d.afterSols !== 'number' || !Number.isInteger(d.afterSols)) {
          errors.push(`${dPath}.afterSols: tam sayı olmalı`)
        } else if (d.afterSols < 1) {
          errors.push(`${dPath}.afterSols: 1'den küçük (${d.afterSols})`)
        }
        if (d.effects === undefined) errors.push(`${dPath}.effects: eksik zorunlu alan`)
        else validateEffects(d.effects, `${dPath}.effects`, errors)
        if (!isNonEmptyString(d.message)) errors.push(`${dPath}.message: eksik zorunlu alan`)
      })
    }
  }
  validateStringArray(value.setFlags, `${path}.setFlags`, errors)
}

function collectEventIds(nasaEvents: unknown): Set<string> {
  const ids = new Set<string>()
  if (!Array.isArray(nasaEvents)) return ids
  for (const e of nasaEvents) {
    if (isRecord(e) && typeof e.id === 'string') ids.add(e.id)
  }
  return ids
}

function result(errors: string[], warnings: string[]): ValidationResult {
  return { ok: errors.length === 0, errors, warnings }
}

// ---------------------------------------------------------------------------
// Dış API

/**
 * Kart listesini doğrular. Hiçbir girdide fırlatmaz.
 * nasaEvents verilmezse boş liste sayılır; nasaEventId taşıyan kart hata verir.
 */
export function validateCards(cards: unknown, nasaEvents?: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!Array.isArray(cards)) {
    errors.push('kartlar: dizi olmalı')
    return result(errors, warnings)
  }
  const eventIds = collectEventIds(nasaEvents)
  const seenIds = new Set<string>()

  cards.forEach((card: unknown, i: number) => {
    let path = `kart[${i}]`
    if (!isRecord(card)) {
      errors.push(`${path}: nesne olmalı`)
      return
    }
    if (isNonEmptyString(card.id)) {
      path = `kart[${i}] "${card.id}"`
      if (seenIds.has(card.id)) errors.push(`${path}: tekrar eden id`)
      seenIds.add(card.id)
    } else {
      errors.push(`${path}.id: eksik zorunlu alan`)
    }

    if (card.act === undefined) errors.push(`${path}.act: eksik zorunlu alan`)
    else if (card.act !== 1 && card.act !== 2 && card.act !== 3) {
      errors.push(`${path}.act: 1, 2 ya da 3 olmalı (${describe(card.act)})`)
    }
    if (!isNonEmptyString(card.title)) errors.push(`${path}.title: eksik zorunlu alan`)
    if (!isNonEmptyString(card.description)) errors.push(`${path}.description: eksik zorunlu alan`)
    if (card.image !== undefined && typeof card.image !== 'string') {
      errors.push(`${path}.image: metin olmalı`)
    }

    if (card.choices === undefined) {
      errors.push(`${path}.choices: eksik zorunlu alan`)
    } else if (!Array.isArray(card.choices)) {
      errors.push(`${path}.choices: dizi olmalı`)
    } else {
      if (card.choices.length !== 2) {
        errors.push(`${path}.choices: seçenek sayısı iki değil (${card.choices.length})`)
      }
      card.choices.forEach((c: unknown, j: number) => validateChoice(c, `${path}.choices[${j}]`, errors))
      const ids = card.choices.map((c: unknown) => (isRecord(c) ? c.id : undefined))
      if (ids.length !== 2 || !ids.includes('a') || !ids.includes('b')) {
        errors.push(`${path}.choices: seçenek id'leri tam olarak 'a' ve 'b' olmalı (${describe(ids)})`)
      }
    }

    if (card.condition !== undefined) {
      const cPath = `${path}.condition`
      if (!isRecord(card.condition)) {
        errors.push(`${cPath}: nesne olmalı`)
      } else {
        validateOptionalNumber(card.condition.minSol, `${cPath}.minSol`, errors)
        validateOptionalNumber(card.condition.maxSol, `${cPath}.maxSol`, errors)
        validateStringArray(card.condition.requiresFlags, `${cPath}.requiresFlags`, errors)
        validateStringArray(card.condition.excludesFlags, `${cPath}.excludesFlags`, errors)
        validateNasaEventRef(card.condition.nasaEventId, `${cPath}.nasaEventId`, eventIds, errors)
      }
    }

    if (card.science !== undefined) {
      const sPath = `${path}.science`
      const s = card.science
      if (!isRecord(s)) {
        errors.push(`${sPath}: nesne olmalı`)
      } else {
        if (!isNonEmptyString(s.text)) errors.push(`${sPath}.text: eksik zorunlu alan`)
        if (!isNonEmptyString(s.sourceTitle)) errors.push(`${sPath}.sourceTitle: eksik zorunlu alan`)
        if (!isNonEmptyString(s.sourceUrl)) {
          errors.push(`${sPath}.sourceUrl: eksik zorunlu alan`)
        } else if (!isHttpsUrl(s.sourceUrl)) {
          errors.push(`${sPath}.sourceUrl: https değil (${s.sourceUrl})`)
        } else if (!isTrustedScienceUrl(s.sourceUrl)) {
          warnings.push(`${sPath}.sourceUrl: nasa.gov ya da asc-csa.gc.ca alan adında değil (${s.sourceUrl})`)
        }
        validateNasaEventRef(s.nasaEventId, `${sPath}.nasaEventId`, eventIds, errors)
        if (!isNonEmptyString(s.verifiedBy)) warnings.push(`${sPath}.verifiedBy: boş`)
      }
    }

    if (card.origin !== undefined && !CARD_ORIGINS.includes(String(card.origin))) {
      errors.push(`${path}.origin: 'final' ya da 'test' olmalı (${describe(card.origin)})`)
    } else if (card.origin === 'test') {
      warnings.push(`${path}.origin: 'test'`)
    }
  })

  return result(errors, warnings)
}

/** NASA olay listesini doğrular. Hiçbir girdide fırlatmaz. */
export function validateNasaEvents(events: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!Array.isArray(events)) {
    errors.push('olaylar: dizi olmalı')
    return result(errors, warnings)
  }
  const seenIds = new Set<string>()

  events.forEach((event: unknown, i: number) => {
    let path = `olay[${i}]`
    if (!isRecord(event)) {
      errors.push(`${path}: nesne olmalı`)
      return
    }
    if (isNonEmptyString(event.id)) {
      path = `olay[${i}] "${event.id}"`
      if (seenIds.has(event.id)) errors.push(`${path}: tekrar eden id`)
      seenIds.add(event.id)
    } else {
      errors.push(`${path}.id: eksik zorunlu alan`)
    }

    if (!isNonEmptyString(event.type)) errors.push(`${path}.type: eksik zorunlu alan`)
    if (!isNonEmptyString(event.summary)) errors.push(`${path}.summary: eksik zorunlu alan`)

    if (event.date === undefined) errors.push(`${path}.date: eksik zorunlu alan`)
    else if (!isIsoDate(event.date)) errors.push(`${path}.date: ISO biçiminde değil (${describe(event.date)})`)

    if (!isNonEmptyString(event.sourceUrl)) errors.push(`${path}.sourceUrl: eksik zorunlu alan`)
    else if (!isHttpsUrl(event.sourceUrl)) errors.push(`${path}.sourceUrl: https değil (${event.sourceUrl})`)

    if (event.origin === undefined) {
      errors.push(`${path}.origin: eksik zorunlu alan`)
    } else if (!EVENT_ORIGINS.includes(String(event.origin))) {
      errors.push(`${path}.origin: 'donki', 'radlab' ya da 'test' olmalı (${describe(event.origin)})`)
    } else if (event.origin === 'test') {
      warnings.push(`${path}.origin: 'test'`)
    }

    if (event.classType !== undefined && typeof event.classType !== 'string') {
      errors.push(`${path}.classType: metin olmalı`)
    }
    if (event.sol !== undefined && (typeof event.sol !== 'number' || !Number.isInteger(event.sol) || event.sol < 1)) {
      errors.push(`${path}.sol: 1 ya da daha büyük tam sayı olmalı (${describe(event.sol)})`)
    }
  })

  return result(errors, warnings)
}
