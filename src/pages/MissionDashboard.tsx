import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, House, RotateCcw, Zap, Leaf, HeartPulse, Shield, X } from 'lucide-react'
import FitContent from '../components/ui/FitContent'
import MarsBaseAnimation from '../components/game/MarsBaseAnimation'
import { MissionAnimationPlayer } from '../missionAnimations/integration/MissionAnimationPlayer'
import type { CutsceneRequest } from '../missionAnimations/integration/types'
import { choiceAnimations, eventAnimations, interventionAnimations, delayedAnimations, restoreVisualState, interventionKey } from '../missionAnimations/missionBridge'
import MissionDecisionCard, { MissionDecisionResult } from '../components/game/MissionDecisionCard'
import SpecialEventPreview from '../components/game/SpecialEventPreview'
import ScienceArchivePanel from '../components/game/ScienceArchivePanel'
import { dailyCards, scienceFacts, specialEvents, type ScienceFact, type SpecialEventType } from '../game/data/beyzaScenario'
import type { UseGameResult } from '../game/useGame'
import type { MissionSpecialEventId, ResourceKey, SpecialEventHistoryEntry } from '../types/game'
import '../styles/mission-dashboard.css'
import '../styles/game-viewport.css'

type MissionDashboardProps = { onBack: () => void; onRestart: () => void; game: UseGameResult }
const resources = [
  { key: 'energy' as const, name: 'Enerji', icon: Zap, color: '#d6a66b', reason: 'Enerji rezervi tükendi; üs sistemleri ve günlük görevler güç gerektirir.', strategy: 'Enerji harcayan kararları dikkatle seç ve üretim ile bakım seçeneklerini dengele.' },
  { key: 'food' as const, name: 'Gıda Stoğu', icon: Leaf, color: '#94ad8a', reason: 'Gıda stoğu tükendi; mürettebatın günlük besin ihtiyacı karşılanamıyor.', strategy: 'Gıda üretimini destekle ve stoğu azaltan kararları sınırlı tut.' },
  { key: 'lifeSupport' as const, name: 'Yaşam Desteği', icon: HeartPulse, color: '#81aeb9', reason: 'Yaşam desteği rezervi tükendi; mürettebat için güvenli yaşam koşulları sürdürülemiyor.', strategy: 'Yaşam destek sistemlerini düzenli denetle ve onarım fırsatlarını önceliklendir.' },
  { key: 'radiationShield' as const, name: 'Radyasyon Kalkanı', icon: Shield, color: '#a99ab9', reason: 'Radyasyon kalkanı tükendi; mürettebatın radyasyondan korunması yetersiz kaldı.', strategy: 'Kalkan rezervini koru ve güneş parçacığı olaylarına hazırlıklı ol.' },
]
const sourceEventIds: Record<string, MissionSpecialEventId> = { 'event-8': 'dust-storm', 'event-11': 'panel-cleaning', 'event-16': 'solar-particles', 'event-19': 'wind-cleaning', 'event-21': 'meteor-archive', 'event-23': 'mars-quake' }
const eventNames: Record<MissionSpecialEventId, string> = { 'dust-storm': 'Toz fırtınası', 'panel-cleaning': 'Panel temizliği', 'solar-particles': 'Güneş parçacıkları', 'wind-cleaning': 'Rüzgâr temizliği', 'meteor-archive': 'Meteor arşivi', 'mars-quake': 'Mars depremi' }

function lossContribution(state: UseGameResult['state'], zeroResources: ResourceKey[]) {
  const candidates = [
    ...state.history.map((entry) => ({ sol: entry.sol, label: `Sol ${entry.sol} kararı`, effects: entry.applied })),
    ...state.specialEvents.history.map((entry) => ({ sol: entry.sol, label: eventNames[entry.eventId], effects: entry.applied })),
  ].filter((entry) => zeroResources.some((resource) => (entry.effects[resource] ?? 0) < 0)).sort((a, b) => b.sol - a.sol)
  return candidates[0]
}

export default function MissionDashboard({ onBack, onRestart, game }: MissionDashboardProps) {
  const submittedCard = useRef<string | null>(null)
  const [sciencePanel, setSciencePanel] = useState<ScienceFact | null>(null)
  const [restartConfirmationOpen, setRestartConfirmationOpen] = useState(false)
  const [decisionResult, setDecisionResult] = useState<{ card: typeof dailyCards[number]; choiceId: 'a' | 'b' } | null>(null)
  const [animationRequest, setAnimationRequest] = useState<CutsceneRequest | null>(null)
  const [sceneState, setSceneState] = useState(() => restoreVisualState(game.state))
  const [animationError, setAnimationError] = useState<string | null>(null)
  const seenAnimations = useRef(new Set<string>())
  const observedHistory = useRef(game.state.history.length)
  const observedInterventions = useRef(new Set(game.state.specialEvents.history.filter(entry => entry.choice).map(entry => interventionKey(game.state.seed, entry))))
  const currentSol = game.state.sol
  const scenarioEvent = specialEvents.find((event) => sourceEventIds[event.id] === game.state.specialEvents.activeEventId)
  const activeDailyCard = dailyCards[currentSol - 1]
  const showSpecialEvent = !decisionResult && game.state.status === 'playing' && game.state.specialEvents.activeEventId !== null && scenarioEvent !== undefined
  const activeEventResult: SpecialEventHistoryEntry | undefined = game.state.specialEvents.activeEventId
    ? game.state.specialEvents.history.findLast((entry) => entry.eventId === game.state.specialEvents.activeEventId && entry.sol === currentSol)
    : undefined

  useEffect(() => {
    if (animationRequest) return
    if (game.state.history.length > observedHistory.current) {
      const entry = game.state.history[observedHistory.current]
      observedHistory.current += 1
      const steps = choiceAnimations(entry.sol, entry.choiceId)
      if (game.state.sol > entry.sol && entry.delayedApplied.length > 0) steps.push(...delayedAnimations(game.state, entry.sol + 1))
      if (steps.length) {
        setAnimationRequest({ eventId: `${game.state.seed}:decision:${entry.sol}:${entry.cardId}:${entry.choiceId}`, title: dailyCards[entry.sol - 1]?.options.find(option => option.id.toLowerCase() === entry.choiceId)?.label, steps })
        return
      }
    }
    for (const entry of game.state.specialEvents.history) {
      if (!entry.choice) continue
      const key = interventionKey(game.state.seed, entry)
      if (observedInterventions.current.has(key)) continue
      observedInterventions.current.add(key)
      const steps = interventionAnimations(entry.eventId, entry.choice)
      if (steps.length) { setAnimationRequest({ eventId: key, title: entry.choice === 'clean' ? 'Paneller temizleniyor' : 'Deprem sonrası onarım', steps }); return }
    }
    if (showSpecialEvent && scenarioEvent) {
      const key = `${game.state.seed}:event:${currentSol}:${scenarioEvent.id}`
      if (seenAnimations.current.has(key)) return
      seenAnimations.current.add(key)
      const steps = eventAnimations(game.state.specialEvents.activeEventId!)
      if (steps.length) setAnimationRequest({ eventId: key, title: scenarioEvent.title, steps })
    }
  }, [game.state, animationRequest, currentSol, showSpecialEvent, scenarioEvent])

  const resolveIntervention = (event: { type: SpecialEventType }, index: number) => {
    if (event.type === 'panelIntervention') {
      game.resolveSpecialEvent(index === 0 ? 'clean' : 'defer')
    }
    if (event.type === 'quake') {
      game.resolveSpecialEvent(index === 0 ? 'repair' : 'defer')
    }
  }
  const chooseMissionCard = (choiceId: 'a' | 'b') => {
    if (!activeDailyCard || !game.card || game.state.status !== 'playing') return
    const submissionKey = `${game.state.seed}:${game.state.history.length}:${game.card.id}`
    if (submittedCard.current === submissionKey) return
    submittedCard.current = submissionKey
    setDecisionResult({ card: activeDailyCard, choiceId })
    game.choose(choiceId)
  }
  const confirmRestart = () => { setRestartConfirmationOpen(false); setSciencePanel(null); setDecisionResult(null); setAnimationRequest(null); setAnimationError(null); setSceneState(restoreVisualState({ ...game.state, sol: 1, history: [], specialEvents: { ...game.state.specialEvents, history: [], activeEventId: null } })); observedHistory.current = 0; observedInterventions.current.clear(); seenAnimations.current.clear(); submittedCard.current = null; onRestart() }
  const zeroResources = resources.filter(({ key }) => game.state.resources[key] <= 0)
  const contribution = lossContribution(game.state, zeroResources.map(({ key }) => key))

  return <div className="mission-dashboard">
    <header className="dashboard-navbar">
      <div className="dashboard-brand"><span className="dashboard-brand-title">SOL SURVIVOR</span><span className="dashboard-brand-subtitle">ARES-7</span></div>
      <nav className="dashboard-nav"><button className="dashboard-nav-item active" type="button"><House size={18} /><span>Görev</span></button></nav>
      <div className="dashboard-header-actions">
        <button className="dashboard-header-action" type="button" onClick={onBack}><ArrowLeft size={17} /><span>Ana Menü</span></button>
        <button className="dashboard-header-action dashboard-header-action--restart" type="button" onClick={() => setRestartConfirmationOpen(true)}><RotateCcw size={16} /><span>Yeniden Başlat</span></button>
      </div>
    </header>

    {animationError && <div className="animation-error" role="alert">{animationError}<button type="button" onClick={() => setAnimationError(null)}>Kapat</button></div>}
    <main className="dashboard-main">
      <section className="dashboard-resources">{resources.map(({ key, name, icon: Icon, color }) => {
        const value = game.state.resources[key]
        return <article className="resource-card" key={key} style={{ '--resource-color': color } as React.CSSProperties}>
          <div className="resource-card-header"><div className="resource-card-name"><Icon size={17} /><span>{name}</span></div><span className="resource-status">NORMAL</span></div>
          <div className="resource-card-value"><strong>{value}</strong><span>/ 100</span></div>
          <div className="resource-progress" role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className="resource-progress-fill" style={{ width: `${value}%` }} /></div>
        </article>
      })}</section>

      <div className="dashboard-content">
        <section className="dashboard-habitat"><MarsBaseAnimation /></section>
        <aside className="dashboard-decision"><FitContent>
          {game.state.usingTestData && <p className="decision-category test-data-badge">TEST DATA</p>}
          {showSpecialEvent && scenarioEvent && <SpecialEventPreview key={scenarioEvent.id} event={scenarioEvent} scienceFact={scenarioEvent.scienceFactId ? scienceFacts.find((fact) => fact.id === scenarioEvent.scienceFactId) : undefined} onShowScience={setSciencePanel} onContinue={game.acknowledgeSpecialEvent} onResolveIntervention={resolveIntervention} eventResult={activeEventResult} />}
          {decisionResult && <MissionDecisionResult card={decisionResult.card} optionId={decisionResult.choiceId} history={game.state.history.at(-1) ?? null} resources={game.state.resources} onContinue={() => setDecisionResult(null)} />}
          {!decisionResult && !showSpecialEvent && game.state.status === 'playing' && activeDailyCard && game.card && <MissionDecisionCard key={game.card.id} card={activeDailyCard} motorCard={game.card} totalSols={30} onChoose={chooseMissionCard} />}
          {!decisionResult && game.state.status === 'lost' && <div className="scenario-complete decision-card-enter loss-report">
            <div className="dashboard-section-label">GÖREV BAŞARISIZ</div><h2>Sol {game.state.sol} · Görev Sona Erdi</h2>
            {zeroResources.length ? <><p>Görevin kaybedilmesine yol açan sıfır kaynaklar:</p><ul className="loss-resource-list">{zeroResources.map(({ key, name, reason, strategy }) => <li key={key}><strong>{name} — 0/100</strong><span>{reason}</span><span><b>Bir sonraki denemede:</b> {strategy}</span></li>)}</ul></> : <p>Görev motoru kayıp durumunu bildirdi. Kaynaklar şu anda sıfır görünmüyor.</p>}
            {contribution && <p className="loss-last-record">Son ilgili kayıtta Sol {contribution.sol} için {contribution.label} kaynak üzerinde negatif etki uyguladı.</p>}
            <button className="decision-confirm" type="button" onClick={() => setRestartConfirmationOpen(true)}>Görevi Yeniden Başlat</button>
          </div>}
          {!decisionResult && game.state.status === 'won' && <div className="scenario-complete decision-card-enter"><div className="dashboard-section-label">GÖREV TAMAMLANDI</div><h2>Mars'ta 30 Sol</h2><p>ARES-7 mürettebatı 30 Sol görevini tamamladı.</p><button className="decision-confirm" type="button" onClick={() => setRestartConfirmationOpen(true)}>Yeni Görev Başlat</button></div>}
        </FitContent></aside>
      </div>
    </main>
    <MissionAnimationPlayer request={animationRequest} sceneState={sceneState} onSceneStateChange={setSceneState}
      onComplete={() => setAnimationRequest(null)}
      onRejected={(_eventId, reason, message) => { if (reason !== 'duplicate') { setAnimationError(message ?? 'Animasyon başlatılamadı.'); setAnimationRequest(null) } }} />
    {sciencePanel && <ScienceArchivePanel fact={sciencePanel} onClose={() => setSciencePanel(null)} />}
    {restartConfirmationOpen && <div className="restart-confirm-backdrop"><section className="restart-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="restart-confirm-title" aria-describedby="restart-confirm-description">
      <button className="greenhouse-dialog-close" type="button" aria-label="Kapat" onClick={() => setRestartConfirmationOpen(false)}><X size={18} /></button><span className="dashboard-section-label">GÖREVİ YENİDEN BAŞLAT</span><h2 id="restart-confirm-title">Mevcut ilerleme silinsin mi?</h2><p id="restart-confirm-description">Kayıtlı Sol ilerlemesi, kararlar ve özel olay durumu temizlenerek yeni görev Sol 1'den başlatılacak.</p>
      <div className="restart-confirm-actions"><button className="restart-confirm-cancel" type="button" onClick={() => setRestartConfirmationOpen(false)}>İptal</button><button className="decision-confirm" type="button" onClick={confirmRestart}>Yeniden Başlat</button></div>
    </section></div>}
  </div>
}
