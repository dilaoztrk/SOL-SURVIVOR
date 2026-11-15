import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Clock3, GitBranch, Minus } from "lucide-react";
import type { ScenarioEffect, ScienceFact, SpecialEvent, SpecialIntervention } from "../../game/data/beyzaScenario";
import type { ResourceKey, SpecialEventHistoryEntry } from "../../types/game";
import RealMarsFactCard from "./RealMarsFactCard";

type SpecialEventPreviewProps = {
  event: SpecialEvent;
  scienceFact: ScienceFact | undefined;
  onShowScience: (fact: ScienceFact) => void;
  onContinue: () => void;
  onResolveIntervention: (event: SpecialEvent, index: number) => void;
  eventResult: SpecialEventHistoryEntry | undefined;
};
const localize = (value: string) => value
  .replace(/Radiation Shield/g, "Radyasyon Kalkanı")
  .replace(/Life Support/g, "Yaşam Desteği")
  .replace(/Energy/g, "Enerji")
  .replace(/Food/g, "Gıda Stoğu")
  .replace(/Shield/g, "Kalkan");

const RESOURCE_LABELS: Record<ResourceKey, string> = {
  energy: "Enerji",
  food: "Gıda Stoğu",
  lifeSupport: "Yaşam Desteği",
  radiationShield: "Radyasyon Kalkanı",
};

function EffectLine({ effect }: { effect: ScenarioEffect }) {
  const positive = /\+\s*\d/.test(effect.text);
  const negative = /[−-]\s*\d/.test(effect.text);
  const Icon = effect.kind === "delayed" ? Clock3 : effect.kind === "conditional" ? GitBranch : positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  const tone = positive ? "positive" : negative ? "negative" : "neutral";
  return <li className={`scenario-effect scenario-effect--${tone} scenario-effect--${effect.kind}`}><Icon size={14} aria-hidden="true" /><span>{localize(effect.text)}</span></li>;
}

export default function SpecialEventPreview({ event, scienceFact, onShowScience, onContinue, onResolveIntervention, eventResult }: SpecialEventPreviewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const scienceStart = event.content.findIndex((line) => line.startsWith("Yandan"));
  const eventLines = event.content.slice(0, scienceStart < 0 ? undefined : scienceStart);
  const story = eventLines.filter((line) => line !== event.when && line && !line.endsWith(":") && !line.startsWith("- ") && !line.startsWith("Müdahale ") && !line.startsWith("Müdahaleyi "));
  const intervention = selected === null ? undefined : event.interventions[selected];

  return <section className="mission-decision-card special-event-card" aria-live="polite">
    <header className="decision-card-header">
      <div className="dashboard-section-label">ÖZEL OLAY</div>
      <span className="decision-sol-badge">SOL {String(event.startSol).padStart(2, "0")}{event.endSol > event.startSol ? `–${String(event.endSol).padStart(2, "0")}` : ""}</span>
    </header>
    <div key={event.id} className="decision-card-content decision-card-enter">
      <span className="decision-category">{localize(event.category)}</span>
      <span className="special-event-when">{localize(event.when)}</span>
      <h2 className="decision-title">{localize(event.title)}</h2>
      <RealMarsFactCard sol={event.startSol} />
      {story.map((line, index) => <p className="special-event-story" key={index}>{localize(line)}</p>)}

      {eventResult && Object.keys(eventResult.applied).length > 0 && <div className="special-event-effects"><span className="special-event-effects-title">Motorun uyguladığı kaynak etkileri</span><ul className="scenario-effects">{(Object.entries(eventResult.applied) as [ResourceKey, number][]).map(([resource, amount]) => <EffectLine key={resource} effect={{ kind: "immediate", text: `${RESOURCE_LABELS[resource]} ${amount > 0 ? "+" : "−"}${Math.abs(amount)}` }} />)}</ul></div>}
      {event.type === "archive" && <p className="science-separation-note">Bu arşiv olayı bilgilendirme amaçlıdır. Üs hasarı veya kaynak kaybı oluşturmaz.</p>}

      {event.interventions.length > 0 && !submitted && <div className="decision-options special-interventions" role="group" aria-label="Özel müdahale seçenekleri">
        {event.interventions.map((choice, index) => <InterventionOption key={index} choice={choice} index={index} selected={selected === index} onSelect={setSelected} />)}
      </div>}
      {submitted && intervention && <div className="special-intervention-result">
        <strong>Müdahale uygulandı · Oyun motoru</strong>
        <p>Kaynak değişimleri motor tarafından kaydedildi.</p>
        {eventResult && Object.keys(eventResult.applied).length > 0 && <ul className="scenario-effects">{(Object.entries(eventResult.applied) as [ResourceKey, number][]).map(([resource, amount]) => <EffectLine key={resource} effect={{ kind: "immediate", text: `${RESOURCE_LABELS[resource]} ${amount > 0 ? "+" : "−"}${Math.abs(amount)}` }} />)}</ul>}
        {intervention.notes.map((note, index) => <p key={index}>{localize(note)}</p>)}
      </div>}

      {scienceFact && <button className="science-fact-trigger" type="button" onClick={() => onShowScience(scienceFact)}>Bilimsel Bilgi</button>}
      {event.interventions.length === 0 ? <button className="decision-confirm" type="button" onClick={onContinue}>Olayı Kapat ve Günlük Karara Geç</button> : !submitted ? <button className="decision-confirm" type="button" disabled={selected === null} onClick={() => { if (selected === null) return; onResolveIntervention(event, selected); setSubmitted(true); }}>Müdahaleyi Uygula</button> : <button className="decision-confirm" type="button" onClick={onContinue}>Günlük Karara Geç</button>}
      <p className="decision-preview-notice">Kaynak etkileri oyun motorunda, NASA bilimsel gözlemleri ayrı arşivde tutulur.</p>
    </div>
  </section>;
}

function InterventionOption({ choice, index, selected, onSelect }: { choice: SpecialIntervention; index: number; selected: boolean; onSelect: (index: number) => void }) {
  return <button className={`decision-option${selected ? " is-selected" : ""}`} type="button" aria-pressed={selected} onClick={() => onSelect(index)}>
    <span className="decision-option-letter">{index === 0 ? "A" : "B"}</span>
    <span className="decision-option-body"><strong>{localize(choice.label)}</strong>
      {choice.effects.length > 0 && <ul className="scenario-effects">{choice.effects.map((effect, effectIndex) => <EffectLine key={effectIndex} effect={effect} />)}</ul>}
      {choice.notes.map((note, noteIndex) => <span className="decision-option-note" key={noteIndex}>{localize(note)}</span>)}
    </span>
  </button>;
}
