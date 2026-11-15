import { useState } from "react";
import MenuPanel, {
  type MenuPanelName,
} from "../components/ui/MenuPanel";

import {
  Play,
  BookOpen,
  Database,
  Settings,
  Info,
  Orbit,
  Radio,
  Activity,
} from "lucide-react";

import GameButton from "../components/ui/GameButton";
import "../styles/main-menu.css";

type MainMenuProps = {
  onStart?: () => void;
  onBriefing?: () => void;
  onNasaData?: () => void;
  onSettings?: () => void;
  onAbout?: () => void;
};

export default function MainMenu({
  onStart,
  onBriefing,
  onNasaData,
  onSettings,
  onAbout,
}: MainMenuProps) {
  const [panel, setPanel] = useState<MenuPanelName | null>(null);
  return (
    <main className="main-menu">
      {/* MARS BACKGROUND */}
      <div className="main-menu__background" aria-hidden="true" />

      {/* DARK OVERLAY */}
      <div className="main-menu__overlay" aria-hidden="true" />

      {/* FUTURISTIC HUD FRAME */}
      <div className="main-menu__hud" aria-hidden="true">
        <span className="hud-corner hud-corner--tl" />
        <span className="hud-corner hud-corner--tr" />
        <span className="hud-corner hud-corner--bl" />
        <span className="hud-corner hud-corner--br" />
      </div>

      {/* TOP HEADER */}
      <header className="main-menu__header">
        <div className="main-menu__brand">
          <Orbit size={25} strokeWidth={1.8} />
          <span>ARES-7 GÖREV KONTROL</span>
        </div>

        <div className="main-menu__system">
          <span className="main-menu__status-dot" />
          <span>SİSTEM AKTİF</span>
        </div>
      </header>

      {/* CENTER CONTENT */}
      <section className="main-menu__content">
        {/* GAME TITLE */}
        <div className="main-menu__title-wrapper">
          <h1 className="main-menu__title">
            <span className="main-menu__title-sol">SOL</span>

            <span className="main-menu__title-survivor">SURVIVOR</span>
          </h1>

          {/* DECORATIVE MARS MOUNTAINS */}
          <div className="main-menu__mountain-line" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="main-menu__subtitle">
            <span className="main-menu__subtitle-line" />
            <span>MARS'TA HAYATTA KALMA SİMÜLASYONU</span>
            <span className="main-menu__subtitle-line" />
          </div>

          <p className="main-menu__tagline">
            30 Sol. Tek Bir Üs. Her Karar Önemli.
          </p>
        </div>

        {/* MENU BUTTONS */}
        <nav className="main-menu__navigation" aria-label="Ana gezinme">
          <GameButton primary icon={<Play size={22} />} onClick={onStart}>
            GÖREVİ BAŞLAT
          </GameButton>

          <GameButton
  icon={<BookOpen size={21} />}
  onClick={() => {
    onBriefing?.();
    setPanel("briefing");
  }}
>
  GÖREV BİLGİLENDİRMESİ
</GameButton>

<GameButton
  icon={<Database size={21} />}
  onClick={() => {
    onNasaData?.();
    setPanel("nasa");
  }}
>
  NASA VERİLERİ
</GameButton>

<GameButton
  icon={<Settings size={21} />}
  onClick={() => {
    onSettings?.();
    setPanel("settings");
  }}
>
  AYARLAR
</GameButton>

<GameButton
  icon={<Info size={21} />}
  onClick={() => {
    onAbout?.();
    setPanel("about");
  }}
>
  HAKKINDA
</GameButton>
        </nav>
      </section>

      {/* BOTTOM HUD */}
      <footer className="main-menu__footer">
        <div className="main-menu__footer-left">
          <Activity size={17} />
          <span>GÖREV: ARES-7</span>
        </div>

        <div className="main-menu__footer-center" aria-hidden="true">
          <Radio size={18} />
          <span>● ● ●</span>
        </div>

        <div className="main-menu__footer-right">
          <span>SÜRÜM 001</span>
        </div>
           </footer>

      <MenuPanel panel={panel} onClose={() => setPanel(null)} />
    </main>
  );
}
