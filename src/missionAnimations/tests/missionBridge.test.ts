import { expect, test } from 'vitest'
import { choiceAnimations, delayedAnimations, restoreVisualState, eventAnimations, interventionAnimations } from '../missionBridge'
import { resolveRequest } from '../animation/registry'
import { createInitialSceneState } from '../animation/types'
import { CutsceneRunner } from '../integration/CutsceneRunner'
import { createGame, choose } from '../../game/engine'
import { missionCards } from '../../game/data/missionCards'
import { MISSION_CONFIG } from '../../game/config'

test('all 60 actual choices resolve and complete through the original animation runner', () => {
  let scene = createInitialSceneState()
  let completions = 0
  const runner = new CutsceneRunner(() => scene, next => { scene = next }, () => { completions++ })
  for (let sol = 1; sol <= 30; sol++) {
    for (const choice of ['a', 'b']) {
      const steps = choiceAnimations(sol, choice)
      expect(steps.length).toBeGreaterThan(0)
      for (const step of steps) expect(() => resolveRequest(step)).not.toThrow()
      expect(runner.submit({ eventId: `${sol}:${choice}`, steps }).accepted).toBe(true)
      runner.skipAll()
      expect(runner.getSnapshot().active).toBe(false)
    }
  }
  expect(completions).toBe(60)
})

test('skip and visual reconstruction preserve real motor resources and history', () => {
  const initial = createGame(missionCards, [], MISSION_CONFIG, 123)
  const committed = choose(initial, missionCards, 'a', [], MISSION_CONFIG)
  const before = JSON.stringify(committed)
  let visual = restoreVisualState(initial)
  let completed = 0
  const runner = new CutsceneRunner(() => visual, next => { visual = next }, () => { completed++ })
  const request = { eventId: 'first-choice', steps: choiceAnimations(1, 'a') }
  runner.submit(request)
  runner.skipAll()
  runner.skipAll()
  expect(runner.submit(request).reason).toBe('duplicate')
  expect(completed).toBe(1)
  expect(JSON.stringify(committed)).toBe(before)
  expect(restoreVisualState(committed)).toEqual(visual)
})

test('delayed harvest only plays when its originating choice exists', () => {
  let state = createGame(missionCards, [], MISSION_CONFIG, 123)
  expect(delayedAnimations(state, 7)).toEqual([])
  for (let sol = 1; sol <= 3; sol++) state = choose(state, missionCards, 'a', [], MISSION_CONFIG)
  expect(delayedAnimations(state, 7).map(step => step.id)).toContain('harvest_result')
})

test('deferred panel cleaning and quake repairs do not animate actions that were not chosen', () => {
  expect(eventAnimations('panel-cleaning')).toEqual([])
  expect(interventionAnimations('panel-cleaning', 'defer')).toEqual([])
  expect(interventionAnimations('mars-quake', 'defer')).toEqual([])
  expect(interventionAnimations('panel-cleaning', 'clean')[0].id).toBe('robot_panel_clean')
  expect(interventionAnimations('mars-quake', 'repair')[0].id).toBe('temporary_repair')
  for (const event of ['dust-storm', 'solar-particles', 'wind-cleaning', 'meteor-archive', 'mars-quake'] as const) {
    expect(eventAnimations(event).length).toBeGreaterThan(0)
    eventAnimations(event).forEach(step => expect(() => resolveRequest(step)).not.toThrow())
  }
})
