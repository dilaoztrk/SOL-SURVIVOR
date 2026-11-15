export type DecisionResource = "energy" | "food";

export type DecisionEffect = {
  resource: DecisionResource;
  amount: number;
  delayedSol?: number;
};

export type DecisionOption = {
  id: "A" | "B";
  label: string;
  effects: DecisionEffect[];
  resultDescription: string;
};

export type MissionDecision = {
  sol: number;
  totalSols: number;
  category: string;
  title: string;
  description: string;
  options: [DecisionOption, DecisionOption];
};
