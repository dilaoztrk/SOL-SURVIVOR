export type GreenhouseAction = "harvest" | "maintenance" | "upgrade";
export type GreenhouseResources = { energy: number; food: number; lifeSupport: number; radiationShield: number };
export type GreenhouseState = GreenhouseResources & {
  sol: number;
  efficiency: number;
  upgradeLevel: number;
  harvestedThisSol: boolean;
  maintainedThisSol: boolean;
  upgraded: boolean;
};
export type GreenhouseResult = { state: GreenhouseState; message: string; effect?: GreenhouseAction };

const clampResource = (value: number) => Math.max(0, Math.min(100, value));
export const createGreenhouseState = (): GreenhouseState => ({
  sol: 1, energy: 80, food: 75, lifeSupport: 85, radiationShield: 70, efficiency: 100, upgradeLevel: 0,
  harvestedThisSol: false, maintainedThisSol: false, upgraded: false,
});

export function performGreenhouseAction(state: GreenhouseState, action: GreenhouseAction): GreenhouseResult {
  if (action === "harvest") {
    if (state.harvestedThisSol) return { state, message: "Hasat bu Sol'de zaten yap\u0131ld\u0131." };
    const amount = Math.min(8, 100 - state.food);
    if (amount === 0) return { state, message: "G\u0131da Sto\u011fu zaten en y\u00fcksek seviyede." };
    return { state: { ...state, food: clampResource(state.food + amount), harvestedThisSol: true }, message: `Hasat tamamland\u0131: G\u0131da Sto\u011fu +${amount}.`, effect: action };
  }
  if (action === "maintenance") {
    if (state.maintainedThisSol) return { state, message: "Sera bak\u0131m\u0131 bu Sol'de zaten yap\u0131ld\u0131." };
    if (state.energy < 5) return { state, message: "Yetersiz Enerji: Bak\u0131m i\u00e7in 5 Enerji gerekli." };
    if (state.efficiency >= 200) return { state, message: "Sera verimlili\u011fi en y\u00fcksek seviyede." };
    return { state: { ...state, energy: clampResource(state.energy - 5), efficiency: Math.min(200, state.efficiency + 10), maintainedThisSol: true }, message: "Bak\u0131m tamamland\u0131: Enerji -5, verimlilik +10%. Sonraki Sol'lerde her 10% ek verimlilik 1 ilave G\u0131da \u00fcretir.", effect: action };
  }
  if (state.upgraded) return { state, message: "LED sistemi zaten geli\u015ftirildi." };
  if (state.energy < 15) return { state, message: "Yetersiz Enerji: LED geli\u015ftirme i\u00e7in 15 Enerji gerekli." };
  return { state: { ...state, energy: clampResource(state.energy - 15), upgradeLevel: 1, upgraded: true }, message: "LED sistemi geli\u015ftirildi: Enerji -15. Bundan sonraki her Sol'de +3 G\u0131da \u00fcretim bonusu uygulanacak.", effect: action };
}

export function advanceGreenhouseSol(state: GreenhouseState): GreenhouseResult {
  const nextSol = state.sol + 1;
  // Sol ba\u015f\u0131na tek \u00fcretim: 2 temel + 1 / 10% verimlilik + 3 / LED seviyesi.
  const efficiencyBonus = Math.floor(Math.max(0, state.efficiency - 100) / 10);
  const ledBonus = state.upgradeLevel * 3;
  const foodGained = Math.min(2 + efficiencyBonus + ledBonus, 100 - state.food);
  return {
    state: { ...state, sol: nextSol, food: clampResource(state.food + foodGained), harvestedThisSol: false, maintainedThisSol: false },
    message: `Sol ${nextSol} ba\u015flad\u0131. Sera \u00fcretimi: G\u0131da Sto\u011fu +${foodGained} (temel 2 + verimlilik ${efficiencyBonus} + LED ${ledBonus}).`,
  };
}
