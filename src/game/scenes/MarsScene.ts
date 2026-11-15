import Phaser from "phaser";
import type { Effects, ResourceKey } from "../../types/game";

export type MarsInteraction = "greenhouse";

export type GreenhouseEffect = "harvest" | "maintenance" | "upgrade";
export type ScenarioVisual = "dustStorm" | "panelIntervention" | "solarParticles" | "windCleaning" | "archive" | "quake";
export type ScenarioAction = "panelClean" | "quakeRepair";
type MarsSceneOptions = { onInteract: (interaction: MarsInteraction) => void; onReady?: () => void };


type Player = Phaser.GameObjects.Container & {
  bodyGraphics: Phaser.GameObjects.Graphics;
  leftLeg: Phaser.GameObjects.Graphics;
  rightLeg: Phaser.GameObjects.Graphics;
  leftArm: Phaser.GameObjects.Graphics;
  rightArm: Phaser.GameObjects.Graphics;
};

export default class MarsScene extends Phaser.Scene {
  private readonly options: MarsSceneOptions;
  private readonly pressedKeys = new Set<string>();
  private player!: Player;
  private prompt!: Phaser.GameObjects.Text;
  private controlHint!: Phaser.GameObjects.Text;
  private scenery!: Phaser.GameObjects.Container;
  private greenhouseGlass!: Phaser.GameObjects.Graphics;
  private controlsEnabled = true;
  private solarPanelDust!: Phaser.GameObjects.Graphics;
  private scenarioVisuals: Phaser.GameObjects.Container | null = null;
  private activeScenarioToken: string | null = null;
  private activeScenarioVisual: ScenarioVisual | null = null;
  private lastScenarioActionToken: string | null = null;
  private lastDecisionToken: string | null = null;
  private readonly playerRadius = 16;

  constructor(options: MarsSceneOptions) {
    super("MarsScene");
    this.options = options;
  }

  create() {
    this.scenery = this.add.container(0, 0);
    // The original photographic background lives underneath this transparent layer.
    this.greenhouseGlass = this.add.graphics();
    this.solarPanelDust = this.add.graphics();
    this.scenery.add([this.greenhouseGlass, this.solarPanelDust]);

    this.player = this.createAstronaut(290, 300) as Player;
    this.player.setScale(0.6);
    this.scenery.add(this.player);

    this.controlHint = this.add.text(884, 16, "WASD / Y\u00f6n Tu\u015flar\u0131: Hareket | E: Etkile\u015fim", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#fff1df",
      backgroundColor: "#30251ee8",
      padding: { x: 10, y: 7 },
    }).setOrigin(1, 0);

    this.prompt = this.add
      .text(450, 365, "E \u2014 Sera ile Etkile\u015fim", {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#fff1df",
        backgroundColor: "#30251ee8",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    const canvas = this.game.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Mars sahnesi. WASD veya y\u00f6n tu\u015flar\u0131yla hareket et.");
    canvas.addEventListener("pointerdown", this.focusCanvas);
    canvas.addEventListener("keydown", this.handleKeyDown);
    canvas.addEventListener("keyup", this.handleKeyUp);
    canvas.addEventListener("blur", this.clearPressedKeys);
    window.addEventListener("blur", this.clearPressedKeys);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeScene, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.resizeScene({ width: this.scale.width, height: this.scale.height } as Phaser.Structs.Size);
    this.controlHint.setVisible(true);
    this.options.onReady?.();
  }

  update(_time: number, delta: number) {
    if (!this.player) return;
    if (!this.controlsEnabled || document.activeElement !== this.game.canvas) {
      this.clearPressedKeys();
      this.animateAstronaut(false, 0, _time);
      return;
    }

    const left = this.pressedKeys.has("a") || this.pressedKeys.has("arrowleft");
    const right = this.pressedKeys.has("d") || this.pressedKeys.has("arrowright");
    const up = this.pressedKeys.has("w") || this.pressedKeys.has("arrowup");
    const down = this.pressedKeys.has("s") || this.pressedKeys.has("arrowdown");
    let dx = Number(right) - Number(left);
    let dy = Number(down) - Number(up);
    const moving = dx !== 0 || dy !== 0;

    if (moving) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      const bounds = this.getWorldBounds();
      const speed = 190 * (delta / 1000);
      this.player.x = Phaser.Math.Clamp(this.player.x + dx * speed, bounds.left, bounds.right);
      this.player.y = Phaser.Math.Clamp(this.player.y + dy * speed, bounds.top, bounds.bottom);
      this.animateAstronaut(true, length, _time);
    } else {
      this.animateAstronaut(false, 0, _time);
    }

    const nearGreenhouse = Phaser.Math.Distance.Between(this.player.x, this.player.y, 665, 214) < 100;
    this.prompt.setVisible(nearGreenhouse);
    this.prompt.setPosition(this.scale.width / 2, this.scale.height * .83);
    this.controlHint.setPosition(16, this.scale.height - 16).setOrigin(0, 1);
  }

  setSpecialEvent(type: ScenarioVisual | null, token: string | null) {
    if (type === this.activeScenarioVisual && token === this.activeScenarioToken) return;
    this.clearScenarioVisuals();
    this.activeScenarioVisual = type;
    this.activeScenarioToken = token;
    if (!type || !token) return;
    if (type === "windCleaning") {
      this.clearSolarPanelDust();
      return;
    }
    if (type === "quake") {
      this.cameras.main.shake(360, 0.006);
      return;
    }
    if (type === "archive" || type === "panelIntervention") return;

    this.scenarioVisuals = this.add.container(0, 0);
    this.scenery.add(this.scenarioVisuals);
    if (type === "dustStorm") {
      const haze = this.add.graphics();
      haze.fillStyle(0x342a2a, 0.25);
      haze.fillRect(0, 0, 900, 440);
      this.scenarioVisuals.add(haze);
      for (let i = 0; i < 28; i++) {
        const dust = this.add.ellipse((i * 83) % 900, 30 + (i * 47) % 390, 8 + i % 9, 2 + i % 3, 0xe3ae79, 0.45);
        this.scenarioVisuals.add(dust);
        this.tweens.add({ targets: dust, x: dust.x + 250 + i % 140, y: dust.y + 14, duration: 2400 + i * 90, repeat: -1, yoyo: true, ease: "Sine.InOut" });
      }
    } else if (type === "solarParticles") {
      const alarm = this.add.text(450, 70, "RADYASYON UYARISI", { fontFamily: "Arial", fontSize: "15px", fontStyle: "bold", color: "#ffd3c7", backgroundColor: "#6f302ee8", padding: { x: 14, y: 9 } }).setOrigin(0.5);
      this.scenarioVisuals.add(alarm);
      this.tweens.add({ targets: alarm, alpha: 0.35, duration: 650, yoyo: true, repeat: 4 });
      const warning = this.add.graphics();
      warning.lineStyle(3, 0xe77b66, 0.65);
      warning.strokeRoundedRect(7, 7, 886, 426, 15);
      this.scenarioVisuals.add(warning);
      this.tweens.add({ targets: warning, alpha: 0.2, duration: 700, yoyo: true, repeat: 4 });
    }
  }

  playScenarioAction(action: ScenarioAction, token: string) {
    if (token === this.lastScenarioActionToken) return;
    this.lastScenarioActionToken = token;
    if (action === "panelClean") {
      this.clearSolarPanelDust();
      return;
    }
    const repair = this.add.graphics();
    repair.lineStyle(3, 0x9bc79b, 0.9);
    repair.strokeRoundedRect(82, 187, 205, 120, 12);
    this.scenery.add(repair);
    this.tweens.add({ targets: repair, alpha: 0, duration: 900, onComplete: () => repair.destroy() });
  }

  showDecisionFeedback(effects: Effects, token: string) {
    if (this.lastDecisionToken === token) return;
    this.lastDecisionToken = token;
    const labels: Record<ResourceKey, string> = { energy: "Enerji", food: "Gıda", lifeSupport: "Yaşam Desteği", radiationShield: "Kalkan" };
    const positions: Record<ResourceKey, [number, number]> = { energy: [475, 230], food: [673, 180], lifeSupport: [180, 180], radiationShield: [180, 150] };
    for (const [key, amount] of Object.entries(effects) as [ResourceKey, number][]) {
      if (!amount) continue;
      const [x, y] = positions[key];
      const text = this.add.text(x, y, `${labels[key]} ${amount > 0 ? '+' : ''}${amount}`, { fontFamily: "Arial", fontSize: "15px", fontStyle: "bold", color: amount > 0 ? "#b6ffcd" : "#ffb09b", backgroundColor: "#172023dd", padding: { x: 8, y: 6 } }).setOrigin(.5);
      this.scenery.add(text);
      this.tweens.add({ targets: text, y: y - 45, alpha: 0, duration: 2200, onComplete: () => text.destroy() });
    }
  }

  private clearSolarPanelDust() {
    if (!this.solarPanelDust || this.solarPanelDust.alpha === 0) return;
    this.tweens.add({ targets: this.solarPanelDust, alpha: 0, duration: 750 });
  }

  private clearScenarioVisuals() {
    if (!this.scenarioVisuals) return;
    this.tweens.killTweensOf(this.scenarioVisuals.list);
    this.scenarioVisuals.destroy(true);
    this.scenarioVisuals = null;
  }

  private createAstronaut(x: number, y: number) {
    const container = this.add.container(x, y) as Player;
    const g = this.add.graphics();
    const leftLeg = this.add.graphics();
    const rightLeg = this.add.graphics();
    const leftArm = this.add.graphics();
    const rightArm = this.add.graphics();
    for (const limb of [leftLeg, rightLeg, leftArm, rightArm]) {
      limb.fillStyle(0xe7e1d5, 1);
    }
    leftLeg.fillRoundedRect(-9, 13, 7, 13, 3);
    rightLeg.fillRoundedRect(2, 13, 7, 13, 3);
    leftArm.fillRoundedRect(-17, 2, 6, 14, 3);
    rightArm.fillRoundedRect(11, 2, 6, 14, 3);
    g.fillStyle(0x222426, 0.38);
    g.fillEllipse(0, 20, 34, 11);
    g.fillStyle(0xd9d5cb, 1);
    g.fillRoundedRect(-11, -1, 22, 23, 7);
    g.fillStyle(0xf3eee4, 1);
    g.fillCircle(0, -11, 12);
    g.fillStyle(0x50616a, 1);
    g.fillEllipse(0, -11, 17, 10);
    g.lineStyle(2, 0xd7a56e, 1);
    g.strokeCircle(0, -11, 12);
    g.fillStyle(0xd7a56e, 1);
    g.fillCircle(-7, 7, 2);
    g.fillCircle(7, 7, 2);
    g.fillStyle(0xe7e1d5, 1);
    g.fillRoundedRect(-13, 4, 5, 15, 2);
    g.fillRoundedRect(8, 4, 5, 15, 2);
    container.bodyGraphics = g;
    container.leftLeg = leftLeg;
    container.rightLeg = rightLeg;
    container.leftArm = leftArm;
    container.rightArm = rightArm;
    container.add([leftLeg, rightLeg, leftArm, rightArm, g]);
    return container;
  }

  private resizeScene(size: Phaser.Structs.Size) {
    if (!this.scenery || !this.prompt) return;
    const scaleX = size.width / 900;
    const scaleY = size.height / 440;
    this.scenery.setScale(scaleX, scaleY);
    this.prompt.setScale(Math.min(scaleX, scaleY));
    this.controlHint.setPosition(16, size.height - 16).setOrigin(0, 1);
  }

  private getWorldBounds() {
    const width = 900;
    const height = 440;
    return {
      left: this.playerRadius,
      right: width - this.playerRadius,
      top: this.playerRadius,
      bottom: height - this.playerRadius - 28,
    };
  }

  private focusCanvas = () => this.game.canvas.focus();

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.controlsEnabled || document.activeElement !== this.game.canvas) return;
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "e"].includes(key)) {
      event.preventDefault();
      this.pressedKeys.add(key);
      if (key === "e" && !event.repeat) this.interact();
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.pressedKeys.delete(event.key.toLowerCase());
  };

  private clearPressedKeys = () => this.pressedKeys.clear();

  setControlsEnabled(enabled: boolean) {
    this.controlsEnabled = enabled;
    this.clearPressedKeys();
    if (!enabled && document.activeElement === this.game.canvas) this.game.canvas.blur();
  }

  showGreenhouseEffect(effect: GreenhouseEffect) {
    if (effect === "upgrade") {
      this.greenhouseGlass.clear();
      this.greenhouseGlass.fillStyle(0x9de4ae, 0.86);
      this.greenhouseGlass.fillRoundedRect(614, 204, 118, 86, 8);
    }
    const flash = this.add.graphics();
    if (effect === "harvest") {
      flash.fillStyle(0x8df59b, 0.35);
      flash.fillRoundedRect(602, 192, 142, 113, 12);
      flash.lineStyle(4, 0x9cff9b, 0.9);
      flash.strokeRoundedRect(602, 192, 142, 113, 12);
    } else {
      flash.lineStyle(3, effect === "upgrade" ? 0xb6ffcd : 0xf0bb76, 0.95);
      flash.strokeRoundedRect(597, 187, 152, 123, 14);
      flash.lineBetween(610, 201, 736, 296);
      flash.lineBetween(736, 201, 610, 296);
    }
    this.scenery.add(flash);
    this.tweens.add({ targets: flash, alpha: 0, duration: 650, onComplete: () => flash.destroy() });
  }

  private animateAstronaut(moving: boolean, direction: number, time: number) {
    if (!this.player) return;
    const swing = moving ? Math.sin(time / 85) * 0.55 : 0;
    this.player.bodyGraphics.setY(moving ? Math.abs(Math.sin(time / 85)) * -2 : Math.sin(time / 380));
    this.player.leftLeg.setRotation(swing * direction);
    this.player.rightLeg.setRotation(-swing * direction);
    this.player.leftArm.setRotation(-swing * direction * 0.7);
    this.player.rightArm.setRotation(swing * direction * 0.7);
  }

  private interact() {
    if (!this.player || Phaser.Math.Distance.Between(this.player.x, this.player.y, 665, 214) >= 100) return;
    this.options.onInteract("greenhouse");
  }

  private cleanup() {
    this.game.canvas.removeEventListener("pointerdown", this.focusCanvas);
    this.game.canvas.removeEventListener("keydown", this.handleKeyDown);
    this.game.canvas.removeEventListener("keyup", this.handleKeyUp);
    this.game.canvas.removeEventListener("blur", this.clearPressedKeys);
    window.removeEventListener("blur", this.clearPressedKeys);
    this.pressedKeys.clear();
    this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeScene, this);
  }
}

