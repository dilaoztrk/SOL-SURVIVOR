/** Static Mars scene kept as a host for a future Three.js scene. */
export default function MarsBaseAnimation() {
  return (
    <div className="habitat-scene mars-base-animation" role="img" aria-label="ARES-7 araştırma üssü, Mars yüzeyinde">
      <div className="habitat-scene-background" />
      <div className="habitat-scene-overlay" />
      <div className="habitat-top-label"><span className="habitat-status-dot" />ÜS GÖRÜNÜMÜ</div>
      <div className="habitat-marker"><span className="habitat-marker-dot" /><div><strong>ARES-7</strong><small>ARAŞTIRMA ÜSSÜ</small></div></div>
      <div className="habitat-info"><span>JEZERO BÖLGESİ · MARS</span><h2>ARES-7 ARAŞTIRMA ÜSSÜ</h2><p>4 mürettebat üyesi · Üs sistemleri aktif</p></div>
      <div className="habitat-scene-status"><span className="habitat-live-dot" />ÜS AKTİF</div>
    </div>
  )
}
