import cardMap from './integration/card-animation-map.json'
import eventMap from './integration/event-animation-map.json'
import delayedMap from './integration/delayed-animation-map.json'
import { animationRegistry, resolveRequest } from './animation/registry'
import { createInitialSceneState, type AnimationRequest, type SceneState } from './animation/types'
import type { GameState, MissionSpecialEventId, SpecialEventHistoryEntry } from '../types/game'

const eventIds: Record<MissionSpecialEventId, string | null> = {
  'dust-storm': 'dust', 'panel-cleaning': null, 'solar-particles': 'particles',
  'wind-cleaning': 'wind', 'meteor-archive': 'impact', 'mars-quake': 'quake',
}
export function choiceAnimations(sol: number, choiceId: string): AnimationRequest[] {
  return structuredClone(cardMap.find(row => row.sol === sol && row.choiceId === choiceId.toUpperCase())?.animations ?? [])
}
export function eventAnimations(eventId: MissionSpecialEventId): AnimationRequest[] {
  return structuredClone(eventMap.find(row => row.eventId === eventIds[eventId])?.animations ?? [])
}
export function interventionAnimations(eventId: MissionSpecialEventId, choice: string): AnimationRequest[] {
  const id = eventId === 'panel-cleaning' && choice === 'clean' ? 'dust_cleanup'
    : eventId === 'mars-quake' && choice === 'repair' ? 'quake_repair' : null
  return structuredClone(eventMap.find(row => row.eventId === id)?.animations ?? [])
}
export function delayedAnimations(state: GameState, dueSol: number): AnimationRequest[] {
  return delayedMap.filter(row => row.dueSol === dueSol && state.history.some(entry => entry.sol === row.originSol && entry.choiceId.toUpperCase() === row.choiceId))
    .flatMap(row => structuredClone(row.animations))
}
/** Reconstruct visual state on return/reload without replaying or charging old choices. */
export function restoreVisualState(state: GameState): SceneState {
  let visual = createInitialSceneState()
  const apply = (steps: AnimationRequest[]) => {
    for (const step of steps) { const request = resolveRequest(step); visual = animationRegistry[request.id].final(visual, request) }
  }
  for (let sol = 1; sol <= state.sol; sol++) {
    if (sol > 1) apply(delayedAnimations(state, sol))
    const events = state.specialEvents.history.filter(entry => entry.sol === sol)
    const visited = new Set<MissionSpecialEventId>()
    for (const entry of events) {
      if (!visited.has(entry.eventId)) {
        // An unacknowledged current event will be played by the host once mounted.
        if (sol !== state.sol || state.specialEvents.activeEventId !== entry.eventId) apply(eventAnimations(entry.eventId))
        visited.add(entry.eventId)
      }
      if (entry.choice) apply(interventionAnimations(entry.eventId, entry.choice))
    }
    const decision = state.history.find(entry => entry.sol === sol)
    if (decision) apply(choiceAnimations(sol, decision.choiceId))
  }
  return visual
}
export function interventionKey(seed: number, entry: SpecialEventHistoryEntry) {
  return `${seed}:intervention:${entry.sol}:${entry.eventId}:${entry.choice}`
}
