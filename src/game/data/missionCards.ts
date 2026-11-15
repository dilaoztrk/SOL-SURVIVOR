import type { Choice, DelayedEffect, Effects, MissionCard, ResourceKey } from '../../types/game.ts'
import { dailyCards, type DailyCard, type DailyOption } from './beyzaScenario.ts'

const RESOURCE_TOKENS: Record<string, ResourceKey> = {
  Energy: 'energy',
  Food: 'food',
  'Life Support': 'lifeSupport',
  'Radiation Shield': 'radiationShield',
}

const NUMBERED_EFFECT = /(Energy|Food|Life Support|Radiation Shield)\s*([+−-])\s*(\d+)/g

function parseEffects(text: string): Effects {
  const effects: Effects = {}
  let match: RegExpExecArray | null
  let count = 0
  while ((match = NUMBERED_EFFECT.exec(text)) !== null) {
    const resource = RESOURCE_TOKENS[match[1] ?? '']
    const amount = Number(match[3]) * ((match[2] === '+' ? 1 : -1) as 1 | -1)
    if (!resource || !Number.isFinite(amount)) continue
    effects[resource] = (effects[resource] ?? 0) + amount
    count += 1
  }
  NUMBERED_EFFECT.lastIndex = 0
  if (count === 0) throw new Error(`Sayısal kaynak etkisi çözümlenemedi: ${text}`)
  return effects
}

function delayedEffect(text: string, sol: number): DelayedEffect | null {
  const dueSol = Number(/Sol\s+(\d+)/.exec(text)?.[1])
  if (!Number.isInteger(dueSol) || dueSol <= sol) return null
  return { afterSols: dueSol - sol, effects: parseEffects(text), message: text }
}

function optionChoice(option: DailyOption, sol: number, overrides: {
  effects?: Effects
  delayed?: DelayedEffect[]
  setFlags?: string[]
} = {}): Choice {
  const immediateEffects: Effects = {}
  const delayed = option.effects.flatMap((effect) => {
    if (effect.kind !== 'delayed') return []
    const parsed = delayedEffect(effect.text, sol)
    return parsed ? [parsed] : []
  })

  for (const effect of option.effects) {
    if (effect.kind !== 'immediate') continue
    for (const [resource, amount] of Object.entries(parseEffects(effect.text)) as [ResourceKey, number][]) {
      immediateEffects[resource] = (immediateEffects[resource] ?? 0) + amount
    }
  }

  return {
    id: option.id.toLowerCase() as Choice['id'],
    label: option.label,
    effects: overrides.effects ?? immediateEffects,
    ...(overrides.delayed ? { delayed: overrides.delayed } : delayed.length ? { delayed } : {}),
    ...(overrides.setFlags ? { setFlags: overrides.setFlags } : {}),
  }
}

function cardForSol(source: DailyCard, variant: 'default' | 'after-sol-1-a' | 'after-sol-1-b' = 'default'): MissionCard {
  const choices = source.options as [DailyOption, DailyOption]
  const firstChoiceFlags = source.sol === 1
    ? [['sol-01-choice-a'], ['sol-01-choice-b']]
    : [undefined, undefined]
  const choiceFlags = source.sol === 2
    ? [undefined, ['sol-02-choice-b']]
    : source.sol === 5
      ? [['sol-05-choice-a'], undefined]
      : firstChoiceFlags

  const card: MissionCard = {
    id: `beyza-sol-${String(source.sol).padStart(2, '0')}${variant === 'default' ? '' : `-${variant}`}`,
    act: source.sol <= 10 ? 1 : source.sol <= 20 ? 2 : 3,
    title: source.title,
    description: source.status,
    choices: [
      optionChoice(choices[0], source.sol, choiceFlags[0] ? { setFlags: choiceFlags[0] } : {}),
      optionChoice(choices[1], source.sol, choiceFlags[1] ? { setFlags: choiceFlags[1] } : {}),
    ],
    condition: { minSol: source.sol, maxSol: source.sol },
    origin: 'final',
  }

  if (source.sol === 4 && variant === 'after-sol-1-a') {
    card.condition = { minSol: 4, maxSol: 4, requiresFlags: ['sol-01-choice-a'] }
    card.choices = [
      optionChoice(choices[0], source.sol, {
        effects: { energy: -4, lifeSupport: -3 },
      }),
      optionChoice(choices[1], source.sol, {
        delayed: [{ afterSols: 4, effects: { lifeSupport: -8 }, message: 'Gecikmeli etki — Sol 8: Life Support −8' }],
      }),
    ]
  }

  if (source.sol === 4 && variant === 'after-sol-1-b') {
    card.condition = { minSol: 4, maxSol: 4, requiresFlags: ['sol-01-choice-b'] }
  }

  return card
}

export const missionCards: MissionCard[] = dailyCards.flatMap((source) => {
  if (source.sol === 4) return [cardForSol(source, 'after-sol-1-a'), cardForSol(source, 'after-sol-1-b')]
  return [cardForSol(source)]
})

export function missionCardForSol(sol: number, firstChoiceWasA: boolean): MissionCard | undefined {
  return missionCards.find((card) =>
    card.condition?.minSol === sol &&
    (sol !== 4 || card.condition.requiresFlags?.includes(firstChoiceWasA ? 'sol-01-choice-a' : 'sol-01-choice-b')),
  )
}
