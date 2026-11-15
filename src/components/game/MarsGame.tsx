import { useEffect, useRef } from "react";
import Phaser from "phaser";
import MarsScene, { type GreenhouseEffect, type ScenarioAction, type ScenarioVisual } from "../../game/scenes/MarsScene";
import type { MarsInteraction } from "../../game/scenes/MarsScene";
import "./mars-game.css";

type MarsGameProps = {
  onInteract: (interaction: MarsInteraction) => void;
  controlsEnabled: boolean;
  feedback: { type: GreenhouseEffect; revision: number } | null;
  scenarioVisual: ScenarioVisual | null;
  scenarioToken: string | null;
  scenarioAction: { type: ScenarioAction; token: string } | null;
};

export default function MarsGame({ onInteract, controlsEnabled, feedback, scenarioVisual, scenarioToken, scenarioAction }: MarsGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onInteract);
  const sceneRef = useRef<MarsScene | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => { callbackRef.current = onInteract; }, [onInteract]);

  useEffect(() => {
    const parent = mountRef.current;
    if (!parent) return;
    const scene = new MarsScene({ onInteract: (interaction) => callbackRef.current(interaction) });
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: "#542f2c",
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
    sceneRef.current?.setControlsEnabled(controlsEnabled);
    if (controlsEnabled && canvasRef.current && document.activeElement !== canvasRef.current) canvasRef.current.focus();
  }, [controlsEnabled]);
  useEffect(() => { if (feedback) sceneRef.current?.showGreenhouseEffect(feedback.type); }, [feedback]);
  useEffect(() => { sceneRef.current?.setSpecialEvent(scenarioVisual, scenarioToken); }, [scenarioVisual, scenarioToken]);
  useEffect(() => { if (scenarioAction) sceneRef.current?.playScenarioAction(scenarioAction.type, scenarioAction.token); }, [scenarioAction]);

  return <div className="mars-game" ref={mountRef} aria-label="WASD veya yön tuşlarıyla astronotu hareket ettir" />;
}
