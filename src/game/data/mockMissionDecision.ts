import type { MissionDecision } from "../types/missionDecision";

export const mockMissionDecision: MissionDecision = {
  sol: 3,
  totalSols: 30,
  category: "Üs Sistemleri",
  title: "Hidroponik LED Yükseltmesi",
  description:
    "Seranın aydınlatma sistemi geliştirilebilir. Bu yükseltme bugün enerji tüketir ancak ilerleyen günlerde gıda üretimini artırabilir.",
  options: [
    {
      id: "A",
      label: "LED sistemini yükselt",
      effects: [
        { resource: "energy", amount: -15 },
        { resource: "food", amount: 26, delayedSol: 7 },
      ],
      resultDescription:
        "LED sistemi yükseltildi. Enerji tüketildi ve ilerleyen günler için gıda üretimi yatırımı yapıldı.",
    },
    {
      id: "B",
      label: "Yükseltmeyi ertele",
      effects: [{ resource: "food", amount: -5 }],
      resultDescription:
        "Yükseltme ertelendi. Bugünkü kaynaklar korundu; mevcut sera düzeniyle devam edilecek.",
    },
  ],
};
