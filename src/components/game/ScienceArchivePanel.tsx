import { X } from "lucide-react";
import FitContent from "../ui/FitContent";
import type { ScienceFact } from "../../game/data/beyzaScenario";

type ScienceArchivePanelProps = { fact: ScienceFact; onClose: () => void };
export default function ScienceArchivePanel({ fact, onClose }: ScienceArchivePanelProps) {
  return <>
    <button className="science-archive-backdrop" type="button" aria-label="Bilim panelini kapat" onClick={onClose} />
    <aside className="science-archive-panel" role="dialog" aria-modal="true" aria-labelledby="science-archive-title">
      <header><div><span className="decision-category">NASA · BİLİMSEL BİLGİ</span><h2 id="science-archive-title">MARS BİLİM ARŞİVİ</h2></div><button type="button" aria-label="Kapat" onClick={onClose}><X size={19} /></button></header>
      <FitContent><article>
        <h3>{fact.title}</h3>
        <p>{fact.description}</p>
      </article>
      <div className="science-archive-source"><span>Kaynak</span>{fact.sourceUrl ? <a href={fact.sourceUrl} target="_blank" rel="noreferrer">{fact.source}</a> : <strong>{fact.source}</strong>}</div>
      <p className="science-separation-note">NASA gözlemi bilimsel kayıttır. Kartlarda belirtilen Enerji, Gıda Stoğu, Yaşam Desteği ve Radyasyon Kalkanı değişimleri oyun senaryosu puanlarıdır; NASA ölçüm değerleri değildir.</p>
      </FitContent><button className="decision-confirm" type="button" onClick={onClose}>Kapat</button>
    </aside>
  </>;
}
