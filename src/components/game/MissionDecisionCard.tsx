import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Clock3, Minus } from 'lucide-react'
import type { HistoryEntry, MissionCard, ResourceKey, Resources } from '../../types/game.ts'
import type { DailyCard, DailyOption } from '../../game/data/beyzaScenario.ts'

type MissionDecisionCardProps = { card: DailyCard; motorCard: MissionCard; totalSols: number; onChoose: (choiceId: 'a' | 'b') => void }
type MissionDecisionResultProps = { card: DailyCard; optionId: 'a' | 'b'; history: HistoryEntry | null; resources: Resources; onContinue: () => void }

const labels: Record<ResourceKey, string> = { energy: 'Enerji', food: 'Gıda Stoğu', lifeSupport: 'Yaşam Desteği', radiationShield: 'Radyasyon Kalkanı' }
const localize = (text: string) => text.replace(/Radiation Shield/g, 'Radyasyon Kalkanı').replace(/Life Support/g, 'Yaşam Desteği').replace(/Energy/g, 'Enerji').replace(/Food/g, 'Gıda Stoğu').replace(/Shield/g, 'Kalkan')

function AppliedEffect({ resource, amount, delayed = false }: { resource: ResourceKey; amount: number; delayed?: boolean }) {
  const Icon = delayed ? Clock3 : amount > 0 ? ArrowUpRight : amount < 0 ? ArrowDownRight : Minus
  return <li className={`scenario-effect scenario-effect--${amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral'}${delayed ? ' scenario-effect--delayed' : ''}`}><Icon size={14} aria-hidden="true" /><span>{labels[resource]} {amount > 0 ? '+' : '−'}{Math.abs(amount)}</span></li>
}

function optionById(card: DailyCard, id: 'a' | 'b'): DailyOption | undefined { return card.options.find((option) => option.id.toLowerCase() === id) }
const futureText = /ileride|sonraki|gelecek|gecikmeli|sol\s*\d+|görev takviminde/i

export default function MissionDecisionCard({ card, motorCard, totalSols, onChoose }: MissionDecisionCardProps) {
  const [selectedOption, setSelectedOption] = useState<DailyOption | null>(null)
  return <section className="mission-decision-card" aria-live="polite">
    <header className="decision-card-header"><div className="dashboard-section-label">GÖREV KARARI</div><span className="decision-sol-badge">SOL {String(card.sol).padStart(2, '0')} <span>/ {totalSols}</span></span></header>
    <div key={`daily-${card.sol}`} className="decision-card-content decision-card-enter">
      <span className="decision-category">Günlük Kart · ARES-7</span><h2 className="decision-title">{card.title}</h2><p className="decision-description">{card.status}</p>
      {card.notes.length > 0 && <div className="scenario-card-notes">{card.notes.filter((note) => !futureText.test(note)).map((note, index) => <p key={index}>{localize(note)}</p>)}</div>}
      <div className="decision-options" role="group" aria-label="Karar seçenekleri">
        {card.options.map((option, index) => {
          const choice = motorCard.choices[index]
          const immediate = Object.entries(choice?.effects ?? {}) as [ResourceKey, number][]
          return <button className={`decision-option${selectedOption?.id === option.id ? ' is-selected' : ''}`} type="button" key={option.id} aria-pressed={selectedOption?.id === option.id} onClick={() => setSelectedOption(option)}>
            <span className="decision-option-letter">{option.id}</span><span className="decision-option-body"><strong>{localize(option.label)}</strong>
              {immediate.length > 0 && <ul className="scenario-effects">{immediate.map(([resource, amount]) => <AppliedEffect key={resource} resource={resource} amount={amount} />)}</ul>}
              {option.notes.filter((note) => !futureText.test(note)).map((note, i) => <span className="decision-option-note" key={i}>{localize(note)}</span>)}
            </span>
          </button>
        })}
      </div>
      <button className="decision-confirm" type="button" disabled={!selectedOption} onClick={() => selectedOption && onChoose(selectedOption.id.toLowerCase() as 'a' | 'b')}>Kararı Onayla</button>
    </div>
  </section>
}

export function MissionDecisionResult({ card, optionId, history, resources, onContinue }: MissionDecisionResultProps) {
  const selectedOption = optionById(card, optionId)
  const applied = (Object.entries(history?.applied ?? {}) as [ResourceKey, number][]).filter(([, amount]) => amount !== 0)
  const delayed = history?.delayedApplied.flatMap((entry) => (Object.entries(entry.effects) as [ResourceKey, number][]).filter(([, amount]) => amount !== 0)) ?? []
  return <section className="mission-decision-card" aria-live="polite">
    <header className="decision-card-header"><div className="dashboard-section-label">GÖREV KARARI</div><span className="decision-sol-badge">SOL {String(card.sol).padStart(2, '0')} <span>/ 30</span></span></header>
    <div className="decision-result decision-card-enter"><span className="decision-result-mark" aria-hidden="true">✓</span><span className="decision-category">Sol {card.sol} · Seçenek {optionId.toUpperCase()}</span>
      <h2>Karar Kaydedildi</h2><p><strong>{selectedOption ? localize(selectedOption.label) : ''}</strong></p><p className="decision-preview-notice">Uygulanan kaynak değişimleri:</p>
      <ul className="scenario-effects decision-result-effects">{applied.map(([resource, amount]) => <AppliedEffect key={resource} resource={resource} amount={amount} />)}
        {delayed.map(([resource, amount], i) => <AppliedEffect key={`delayed-${i}-${resource}`} resource={resource} amount={amount} delayed />)}
        {applied.length === 0 && delayed.length === 0 && <li className="scenario-effect scenario-effect--neutral"><Minus size={14} aria-hidden="true" /><span>Bu seçimde kaynak değişikliği uygulanmadı.</span></li>}
      </ul><p className="decision-description">Güncel kaynaklar: Enerji {resources.energy}, Gıda Stoğu {resources.food}, Yaşam Desteği {resources.lifeSupport}, Radyasyon Kalkanı {resources.radiationShield}.</p>
      <button className="decision-confirm" type="button" onClick={onContinue}>Devam Et</button>
    </div>
  </section>
}

