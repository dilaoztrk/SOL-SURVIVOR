export type ResourceKey = 'energy' | 'food' | 'lifeSupport' | 'radiationShield'

export type Resources = Record<ResourceKey, number>

export type Effects = Partial<Record<ResourceKey, number>>

export interface DelayedEffect {
  afterSols: number
  effects: Effects
  message: string
}

export interface Choice {
  id: 'a' | 'b'
  label: string
  effects: Effects
  delayed?: DelayedEffect[]
  setFlags?: string[]
}

export interface CardCondition {
  minSol?: number
  maxSol?: number
  requiresFlags?: string[]
  excludesFlags?: string[]
  nasaEventId?: string
}

export interface ScienceNote {
  text: string
  sourceTitle: string
  sourceUrl: string
  nasaEventId?: string
  verifiedBy?: string
}

export interface MissionCard {
  id: string
  act: 1 | 2 | 3
  title: string
  description: string
  image?: string
  choices: [Choice, Choice]
  science?: ScienceNote
  condition?: CardCondition
  origin?: 'final' | 'test'
}

export interface NasaEvent {
  id: string
  type: string
  date: string
  summary: string
  classType?: string
  sourceUrl: string
  sol?: number
  origin: 'donki' | 'radlab' | 'test'
}

export type GameStatus = 'playing' | 'won' | 'lost'

export interface PendingEffect {
  dueSol: number
  effects: Effects
  message: string
  fromCardId: string
}

export interface HistoryEntry {
  sol: number
  cardId: string
  choiceId: 'a' | 'b'
  applied: Effects
  delayedApplied: { message: string; effects: Effects }[]
  resourcesAfter: Resources
}

export interface GameState {
  sol: number
  resources: Resources
  status: GameStatus
  failedResource?: ResourceKey
  flags: string[]
  pending: PendingEffect[]
  history: HistoryEntry[]
  currentCardId: string | null
  usedCardIds: string[]
  seed: number
  usingTestData: boolean
}

export interface GameConfig {
  totalSols: number
  startResources: Resources
  dailyDrain: Effects
}
