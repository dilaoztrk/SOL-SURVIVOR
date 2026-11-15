import type { GameConfig } from '../types/game.ts'

export const MISSION_CONFIG: GameConfig = {
  totalSols: 30,
  startResources: { energy: 100, food: 100, lifeSupport: 100, radiationShield: 100 },
  dailyDrain: { energy: 0, food: -1, lifeSupport: 0, radiationShield: 0 },
}
