type MarsFact = {
  mission: string;
  date: string;
  title: string;
  observation: string;
  lesson: string;
  adaptation: string;
  sourceUrl: string;
};

const facts: Record<number, MarsFact> = {
  8: {
    mission: "Opportunity",
    date: "Haziran 2018",
    title: "Bir toz fırtınası görevi durdurabilir",
    observation:
      "2018’de Mars’ı kaplayan büyük toz fırtınası, Opportunity’nin güneş panellerine ulaşan ışığı azalttı. Araçla son iletişim 10 Haziran 2018’de kuruldu ve yeniden bağlantı sağlanamadı.",
    lesson:
      "Güneş enerjisiyle çalışan sistemlerde atmosferdeki toz, enerji üretimini ciddi biçimde azaltabilir.",
    adaptation:
      "ARES-7’nin sera kayıpları ve kaynak puanları oyun için tasarlanmıştır.",
    sourceUrl:
      "https://science.nasa.gov/mission/mer-opportunity/",
  },

  11: {
    mission: "InSight",
    date: "22 Mayıs 2021",
    title: "Panelleri temizlemek için kum kullanıldı",
    observation:
      "InSight ekibi, robot koluyla bir güneş panelinin yakınına kum döktü. Rüzgârın taşıdığı kum taneleri paneldeki tozun bir bölümünü uzaklaştırdı ve enerji üretiminde artış sağlandı.",
    lesson:
      "Panel temizliği Mars’ta gerçek bir mühendislik problemidir; kullanılan yöntem görev aracının imkânlarına bağlıdır.",
    adaptation:
      "Oyundaki temizleme robotu, bu olayın birebir canlandırması değildir.",
    sourceUrl:
      "https://www.nasa.gov/centers-and-facilities/jpl/nasas-insight-mars-lander-gets-a-power-boost/",
  },

  16: {
    mission: "Curiosity",
    date: "20 Mayıs 2024",
    title: "Güneş fırtınası Mars yüzeyine ulaştı",
    observation:
      "Curiosity’nin RAD cihazı, güneş fırtınası sırasında Mars yüzeyindeki radyasyonda belirgin bir artış ölçtü. Enerjik parçacıklar, aracın kamera görüntülerinde çizgiler ve noktalar da oluşturdu.",
    lesson:
      "Gelecekteki insanlı görevlerde radyasyon takibi ve korunaklı alanların planlanması önemlidir.",
    adaptation:
      "Oyundaki kalkan puanı, ölçülmüş bir radyasyon dozunu temsil etmez.",
    sourceUrl:
      "https://science.nasa.gov/resource/curiosity-sees-streaks-and-specks-during-2024-solar-storm/",
  },

  19: {
    mission: "Spirit",
    date: "Mart 2005",
    title: "Rüzgâr bazen enerji üretimine yardımcı olur",
    observation:
      "Spirit’in güneş panellerindeki tozun bir kısmı rüzgârla uzaklaştı. Paneller daha fazla güneş ışığı alabildi ve aracın enerji üretimi arttı.",
    lesson:
      "Mars rüzgârları toz biriktirebildiği gibi bazı koşullarda yüzeyleri temizleyebilir. Bu fayda garanti değildir.",
    adaptation:
      "Oyundaki enerji artışı, gerçek ölçümün sayısal karşılığı değildir.",
    sourceUrl:
      "https://science.nasa.gov/resource/before-and-after-a-cleaning-event-on-spirit/",
  },

  21: {
    mission: "InSight ve Mars Reconnaissance Orbiter",
    date: "24 Aralık 2021",
    title: "Bir çarpma hem duyuldu hem görüntülendi",
    observation:
      "Mars’a çarpan bir meteoroidin oluşturduğu sismik sinyaller InSight tarafından kaydedildi. Mars Reconnaissance Orbiter görüntüleri, yaklaşık 150 metre çapındaki yeni krateri ortaya koydu.",
    lesson:
      "Yüzeydeki sismik ölçümler ve yörünge görüntüleri birlikte kullanılarak olayın nedeni belirlenebilir.",
    adaptation:
      "Bu arşiv kaydı, ARES-7 üssüne gerçekleşmiş bir çarpma anlamına gelmez.",
    sourceUrl:
      "https://www.nasa.gov/missions/insight/nasas-insight-lander-detects-stunning-meteoroid-impact-on-mars/",
  },

  23: {
    mission: "InSight",
    date: "4 Mayıs 2022",
    title: "Mars’ta da deprem oluyor",
    observation:
      "InSight, 4 Mayıs 2022’de güçlü bir Mars depremi kaydetti. Sismik dalgalar, bilim insanlarının Mars’ın iç yapısını araştırmasına yardımcı oldu.",
    lesson:
      "Mars yüzeyi tamamen hareketsiz değildir. Sismik gözlemler, gezegenin kabuğu ve daha derin katmanları hakkında bilgi verir.",
    adaptation:
      "ARES-7’deki bağlantı hasarı ve onarım ihtiyacı, oyunun varsayımsal senaryosudur.",
    sourceUrl:
      "https://www.nasa.gov/missions/insight/nasas-insight-records-monster-quake-on-mars/",
  },
};

export default function RealMarsFactCard({ sol }: { sol: number }) {
  const fact = facts[sol];
  if (!fact) return null;

  return (
    <details className="real-mars-fact">
      <summary>
        <span className="real-mars-fact__badge">
          MARS’TA GERÇEKTEN GÖZLEMLENDİ
        </span>
        <strong>{fact.title}</strong>
        <span className="real-mars-fact__hint">
          Gerçek olayı öğren ▾
        </span>
      </summary>

      <div className="real-mars-fact__body">
        <div className="real-mars-fact__meta">
          {fact.mission} · {fact.date}
        </div>

        <h3>Gerçekte ne oldu?</h3>
        <p>{fact.observation}</p>

        <h3>Bu bize ne öğretiyor?</h3>
        <p>{fact.lesson}</p>

        <p className="real-mars-fact__adaptation">
          <strong>Oyuna uyarlaması:</strong> {fact.adaptation}
        </p>

        <a href={fact.sourceUrl} target="_blank" rel="noreferrer">
          NASA kaynağını incele ↗
        </a>
      </div>
    </details>
  );
}