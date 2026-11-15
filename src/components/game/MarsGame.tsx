import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import MarsScene, { type GreenhouseEffect, type ScenarioAction, type ScenarioVisual } from "../../game/scenes/MarsScene";
import type { MarsInteraction } from "../../game/scenes/MarsScene";
import "./mars-game.css";

import type { Effects } from "../../types/game";

type MarsGameProps = {
  decisionFeedback: { token: string; effects: Effects } | null;
  onInteract: (interaction: MarsInteraction) => void;
  controlsEnabled: boolean;
  feedback: { type: GreenhouseEffect; revision: number } | null;
  scenarioVisual: ScenarioVisual | null;
  scenarioToken: string | null;
  scenarioAction: { type: ScenarioAction; token: string } | null;
};

export default function MarsGame({ onInteract, controlsEnabled, feedback, scenarioVisual, scenarioToken, scenarioAction, decisionFeedback }: MarsGameProps) {
  const [ready, setReady] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onInteract);
  const sceneRef = useRef<MarsScene | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => { callbackRef.current = onInteract; }, [onInteract]);

  useEffect(() => {
    const parent = mountRef.current;
    if (!parent) return;
    const scene = new MarsScene({ onInteract: (interaction) => callbackRef.current(interaction), onReady: () => { canvasRef.current = parent.querySelector("canvas"); setReady(true); } });
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      transparent: true,
      scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 900, height: parent.clientHeight || 440 },
      render: { antialias: true, pixelArt: false },
      scene: [scene],
      input: { keyboard: true },
    });
    canvasRef.current = game.canvas;
    return () => {
      sceneRef.current = null;
      canvasRef.current = null;
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    sceneRef.current?.setControlsEnabled(controlsEnabled);
    if (controlsEnabled && canvasRef.current && document.activeElement !== canvasRef.current) canvasRef.current.focus();
  }, [controlsEnabled, ready]);
  useEffect(() => { if (ready && feedback) sceneRef.current?.showGreenhouseEffect(feedback.type); }, [feedback, ready]);
  useEffect(() => { if (ready) sceneRef.current?.setSpecialEvent(scenarioVisual, scenarioToken); }, [scenarioVisual, scenarioToken, ready]);
  useEffect(() => { if (ready && scenarioAction) sceneRef.current?.playScenarioAction(scenarioAction.type, scenarioAction.token); }, [scenarioAction, ready]);

  useEffect(() => { if (ready && decisionFeedback) sceneRef.current?.showDecisionFeedback(decisionFeedback.effects, decisionFeedback.token); }, [decisionFeedback, ready]);

  return <div className="mars-game" ref={mountRef} aria-label="Kart kararları ve özel olay animasyonları" />;
}
