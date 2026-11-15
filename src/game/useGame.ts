import { useCallback, useEffect, useState } from 'react'
import type { GameConfig, GameState, MissionCard, MissionSpecialEventChoice, NasaEvent } from '../types/game.ts'
import { acknowledgeSpecialEvent as acknowledgeSpecialEventEngine, choose as chooseEngine, createGame, DEFAULT_CONFIG, getCurrentCard, resolveSpecialEvent as resolveSpecialEventEngine, resumeCurrentSolSpecialEvent } from './engine.ts'
import { clearGame, isSaveCompatible, loadGame, migrateSavedCardId, saveGame } from './storage.ts'

const NO_EVENTS: readonly NasaEvent[] = []

export interface UseGameResult {
  state: GameState
  card: MissionCard | null
  choose: (choiceId: 'a' | 'b') => void
  acknowledgeSpecialEvent: () => void
  resolveSpecialEvent: (choice: Exclude<MissionSpecialEventChoice, 'continue'>) => void
  restart: () => void
}

/**
 * Arayüz için ince sarmalayıcı. Kartlar parametre olarak gelir, varsayılan veri yoktur.
 * Başlangıçta kaydı yükler; kayıt yoksa ya da uyumsuzsa kaydı siler ve yeni oyun başlatır.
 * Her state değişikliğinde kayıt useEffect içinde yapılır.
 */
export function useGame(
  cards: readonly MissionCard[],
  nasaEvents: readonly NasaEvent[] = NO_EVENTS,
  config: GameConfig = DEFAULT_CONFIG,
): UseGameResult {
  const [state, setState] = useState<GameState>(() => {
    const saved = loadGame()
    const migrated = saved ? migrateSavedCardId(saved, cards) : null
    if (migrated && isSaveCompatible(migrated, cards, nasaEvents, config)) return resumeCurrentSolSpecialEvent(migrated)
    clearGame() // idempotent: StrictMode'da iki kez çalışması sorun değil
    return createGame(cards, nasaEvents, config)
  })

  useEffect(() => {
    saveGame(state)
  }, [state])

  const choose = useCallback(
    (choiceId: 'a' | 'b') => {
      // chooseEngine saf: StrictMode updater'ı iki kez çağırsa da sonuç aynıdır.
      setState((prev) => chooseEngine(prev, cards, choiceId, nasaEvents, config))
    },
    [cards, nasaEvents, config],
  )

  const acknowledgeSpecialEvent = useCallback(() => {
    setState((prev) => acknowledgeSpecialEventEngine(prev))
  }, [])

  const resolveSpecialEvent = useCallback((choice: Exclude<MissionSpecialEventChoice, 'continue'>) => {
    setState((prev) => resolveSpecialEventEngine(prev, choice))
  }, [])

  const restart = useCallback(() => {
    clearGame()
    setState(createGame(cards, nasaEvents, config))
  }, [cards, nasaEvents, config])

  return { state, card: getCurrentCard(state, cards), choose, acknowledgeSpecialEvent, resolveSpecialEvent, restart }
}
