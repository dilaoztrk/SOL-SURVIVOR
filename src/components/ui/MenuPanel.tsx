import { useEffect, useRef, useState } from "react";
import "../../styles/menu-panel.css";

export type MenuPanelName = "briefing" | "nasa" | "settings" | "about";

export function readReducedMotion() {
  try {
    return localStorage.getItem("sol-survivor:reduce-motion") === "true";
  } catch {
    return false;
  }
}

const titles: Record<MenuPanelName, string> = {
  briefing: "Görev Bilgilendirmesi",
  nasa: "NASA Verileri",
  settings: "Ayarlar",
  about: "Hakkında",
};

const sources = [
  {
    title: "Opportunity · Toz fırtınası",
    description: "Tozun güneş enerjisi üretimine etkisi.",
    url: "https://science.nasa.gov/mission/mer-opportunity/",
  },
  {
    title: "Curiosity · Radyasyon",
    description: "Mars yüzeyine ulaşan güneş parçacıkları.",
    url: "https://science.nasa.gov/resource/curiosity-sees-streaks-and-specks-during-2024-solar-storm/",
  },
  {
    title: "Spirit · Rüzgârla temizlenme",
    description: "Panellerdeki tozun rüzgârla uzaklaşması.",
    url: "https://science.nasa.gov/resource/before-and-after-a-cleaning-event-on-spirit/",
  },
  {
    title: "InSight · Meteoroid çarpması",
    description: "Sismik kayıtlar ve yörünge görüntüleri.",
    url: "https://www.nasa.gov/missions/insight/nasas-insight-lander-detects-stunning-meteoroid-impact-on-mars/",
  },
  {
    title: "InSight · Mars depremi",
    description: "Mars’ın iç yapısını araştıran sismik gözlemler.",
    url: "https://www.nasa.gov/missions/insight/nasas-insight-records-monster-quake-on-mars/",
  },
];

export default function MenuPanel({
  panel,
  onClose,
}: {
  panel: MenuPanelName | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
  const [fullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;

    if (panel && !element.open) element.showModal();
    if (!panel && element.open) element.close();
  }, [panel]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
    try {
      localStorage.setItem(
        "sol-survivor:reduce-motion",
        String(reducedMotion),
      );
    } catch {
      // Tarayıcı kayıt izni vermese de mevcut oturum çalışır.
    }
  }, [reducedMotion]);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    update();
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
      setMessage("");
    } catch {
      setMessage("Tam ekran açılamadı. F11 tuşunu kullanabilirsin.");
    }
  }

  return (
    <dialog
      ref={dialog}
      className="menu-panel"
      aria-labelledby="menu-panel-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="menu-panel__surface">
        <header className="menu-panel__header">
          <div>
            <span className="menu-panel__eyebrow">ARES-7 · GÖREV MERKEZİ</span>
            <h2 id="menu-panel-title">{panel ? titles[panel] : ""}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </header>

        <div className="menu-panel__body">
          {panel === "briefing" && (
            <>
              <p>
                ARES-7’nin yönetimini devralıyorsun. Amacın, dört kişilik
                mürettebatı Mars’ta 30 Sol boyunca hayatta tutmak.
                Sol, bir Mars günüdür.
              </p>

              <div className="menu-panel__grid">
                <article>
                  <h3>Dört kaynağı koru</h3>
                  <p>
                    Enerji, Gıda Stoğu, Yaşam Desteği ve Radyasyon Kalkanı.
                    Herhangi biri sıfıra düşerse görev sona erer.
                  </p>
                </article>
                <article>
                  <h3>Her Sol bir karar</h3>
                  <p>
                    İki seçenekten birini seç ve onayla. Kararın animasyonla
                    gösterilir; ardından uygulanan etkileri görürsün.
                  </p>
                </article>
                <article>
                  <h3>Geleceği de düşün</h3>
                  <p>
                    Bazı seçimler hemen sonuç verir. Bazıları ilerleyen
                    Sol’lerde üretim artışı veya sistem arızası oluşturur.
                  </p>
                </article>
                <article>
                  <h3>Olaylara hazırlan</h3>
                  <p>
                    Toz fırtınaları, radyasyon ve depremler planını
                    değiştirebilir. Bilimsel bilgi bölümünden gerçek
                    Mars gözlemlerini inceleyebilirsin.
                  </p>
                </article>
              </div>

              <p className="menu-panel__note">
                İlerleme bu tarayıcıda otomatik kaydedilir. Animasyonu
                atlamak seçimi iptal etmez. Yeniden Başlat, onayından
                sonra mevcut görevi sıfırlar.
              </p>
            </>
          )}

          {panel === "nasa" && (
            <>
              <p>
                Oyundaki çevresel olaylar, NASA görevlerinin Mars
                gözlemlerinden esinlenir. Kaynakları aşağıdan inceleyebilirsin.
              </p>

              <div className="menu-panel__sources">
                {sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div>
                      <strong>{source.title}</strong>
                      <span>{source.description}</span>
                    </div>
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>

              <p className="menu-panel__note">
                Bu sürüm canlı NASA verisi çekmez. Olay takvimi ve kaynak
                puanları oyun tasarımıdır; fiziksel tahmin veya NASA
                ölçüm sonucu değildir. Kaynak bağlantıları internet gerektirir.
              </p>
            </>
          )}

          {panel === "settings" && (
            <>
              <div className="menu-panel__setting">
                <div>
                  <h3>Tam ekran</h3>
                  <p>Oyunu tarayıcı çerçevesi olmadan görüntüle.</p>
                </div>
                <button type="button" onClick={toggleFullscreen}>
                  {fullscreen ? "Tam Ekrandan Çık" : "Tam Ekrana Geç"}
                </button>
              </div>

              <label className="menu-panel__setting">
                <div>
                  <h3>Hareketi azalt</h3>
                  <p>
                    Animasyonlarda kamera sarsıntısını ve hareket
                    yoğunluğunu azalt. Tercihin bu tarayıcıda saklanır.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setReducedMotion(event.target.checked)}
                />
              </label>

              {message && <p role="status">{message}</p>}
            </>
          )}

          {panel === "about" && (
            <>
              <h3>30 Sol. Tek bir üs. Her karar önemli.</h3>
              <p>
                Sol Survivor, Mars’ta kurulan bir koloninin olası
                senaryolarda hayatta kalmasını simüle eden interaktif
                bir oyundur.
              </p>
              <p>
                Oyuncu, sınırlı kaynaklarla günlük ihtiyaçları,
                bakım kararlarını ve beklenmedik olayları yönetir.
                Seçimlerin hem anlık hem de gecikmeli sonuçları vardır.
              </p>
              <div className="menu-panel__grid">
                <article>
                  <h3>Deneyimleyerek öğren</h3>
                  <p>
                    Kaynak yönetimini, kararların sonuçlarını
                    görerek ve farklı stratejiler deneyerek keşfet.
                  </p>
                </article>
                <article>
                  <h3>Bilimden ilham al</h3>
                  <p>
                    Gerçek Mars gözlemleri, bilgi kartları ve
                    3D animasyonlarla oyun deneyimine eşlik eder.
                  </p>
                </article>
              </div>
              <p className="menu-panel__note">
                ARES-7 ve mürettebatı kurgusaldır. Proje eğitim amaçlıdır;
                NASA’nın resmî ürünü veya onayladığı bir simülasyon değildir.
              </p>
            </>
          )}
        </div>

        <footer className="menu-panel__footer">
          <button type="button" onClick={onClose}>Ana Menüye Dön</button>
        </footer>
      </div>
    </dialog>
  );
}