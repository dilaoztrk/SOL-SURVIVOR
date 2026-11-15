import { useEffect, useState } from "react";
import { SceneViewer } from "../missionAnimations/scene/SceneViewer";
import { AnimationController } from "../missionAnimations/animation/controller";
import {
  createInitialSceneState,
  type Location,
} from "../missionAnimations/animation/types";
import { readReducedMotion } from "../components/ui/MenuPanel";
import "../styles/mission-intro.css";

type MissionIntroProps = {
  onContinue: () => void;
  onBack: () => void;
};

type Shot = {
  until: number;
  chapter: string;
  label: string;
  title: string;
  text: string;
  location: Location;
};

const shots: Shot[] = [
  {
    until: 7,
    chapter: "01",
    label: "MARS · JEZERO BÖLGESİ",
    title: "Dünya artık çok uzakta.",
    text: "Burada her yeni gün, sahip olduklarınla neleri koruyabileceğine karar vererek başlar.",
    location: "departure",
  },
  {
    until: 14,
    chapter: "02",
    label: "ARES-7 ARAŞTIRMA ÜSSÜ",
    title: "Dört kişi sana güveniyor.",
    text: "Araştırma görevini devraldın, Komutan. Mürettebatının güvenliği ve üssün çalışmaya devam etmesi senin sorumluluğunda.",
    location: "habitat",
  },
  {
    until: 18,
    chapter: "03",
    label: "ENERJİ SİSTEMLERİ",
    title: "Her sistem diğerine bağlı.",
    text: "Güneş panelleri enerji üretir. Fakat Mars’ın tozu, bir anda bütün planını değiştirebilir.",
    location: "solar",
  },
  {
    until: 22,
    chapter: "03",
    label: "SERA MODÜLÜ",
    title: "Bugünkü bakım, yarının öğünü.",
    text: "Gıda üretimi dikkat ister. Bugün ertelediğin bir işin bedelini günler sonra ödeyebilirsin.",
    location: "greenhouse",
  },
  {
    until: 26,
    chapter: "03",
    label: "YAŞAM DESTEK SİSTEMLERİ",
    title: "Her kararın bir bedeli var.",
    text: "Bir sistemi korumak için bazen diğerinden fedakârlık yapacaksın. Kaynakların sınırlı; sorumluluğun büyük.",
    location: "utilities",
  },
  {
    until: 33,
    chapter: "04",
    label: "GÖREV BAŞLANGICI · SOL 1",
    title: "Artık komuta sende.",
    text: "Önünde 30 Sol var. Üssü çalışır durumda tut. Kaynaklarını koru. Dört kişilik ekibini hayatta tut.",
    location: "habitat",
  },
];

const TOTAL_SECONDS = 33;

export default function MissionIntro({
  onContinue,
  onBack,
}: MissionIntroProps) {
  const [elapsed, setElapsed] = useState(0);
  const [sceneState] = useState(createInitialSceneState);
  const [reducedMotion] = useState(readReducedMotion);

  const [controller] = useState(
    () => new AnimationController(() => sceneState, () => {}),
  );

  const finished = elapsed >= TOTAL_SECONDS;

  useEffect(() => {
    if (finished) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setElapsed((value) => Math.min(TOTAL_SECONDS, value + 0.1));
    }, 100);

    return () => window.clearInterval(timer);
  }, [finished]);

  const foundIndex = shots.findIndex((shot) => elapsed < shot.until);
  const shotIndex = foundIndex === -1 ? shots.length - 1 : foundIndex;
  const shot = shots[shotIndex];

  return (
    <main className="mission-intro-film">
      <div className="mission-intro-film__scene">
        <SceneViewer
          controller={controller}
          state={sceneState}
          location={shot.location}
          reducedMotion={reducedMotion}
        />
      </div>

      <div className="mission-intro-film__shade" aria-hidden="true" />

      <header className="mission-intro-film__header">
        <div className="mission-intro-film__brand">
          <strong>SOL SURVIVOR</strong>
          <span>ARES-7 · GÖREVİN BAŞLANGICI</span>
        </div>

        <button type="button" onClick={onBack}>
          ← Ana Menü
        </button>
      </header>

      <div className="mission-intro-film__chapter" aria-hidden="true">
        <span>{shot.chapter}</span>
        <small>/ 04</small>
      </div>

      <section className="mission-intro-film__caption">
        <div key={shotIndex} className="mission-intro-film__text">
          <span className="mission-intro-film__label">
            {shot.label}
          </span>

          <h1>{shot.title}</h1>
          <p>{shot.text}</p>
        </div>

        <div
          className="mission-intro-film__progress"
          role="progressbar"
          aria-label="Görev hikâyesi"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((elapsed / TOTAL_SECONDS) * 100)}
        >
          <div
            style={{
              width: `${(elapsed / TOTAL_SECONDS) * 100}%`,
            }}
          />
        </div>

        <div className="mission-intro-film__actions">
          {finished ? (
            <button
              className="mission-intro-film__start"
              type="button"
              onClick={onContinue}
            >
              KOMUTAYI DEVRAL <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              className="mission-intro-film__skip"
              type="button"
              onClick={onContinue}
            >
              Girişi Atla →
            </button>
          )}

          <span>30 SOL · 4 MÜRETTEBAT · TEK BİR ÜS</span>
        </div>
      </section>
    </main>
  );
}