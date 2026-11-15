export type EffectKind = "immediate" | "delayed" | "conditional" | "explanation";
export type ScenarioEffect = { text: string; kind: EffectKind };
export type DailyOption = { id: "A" | "B"; label: string; effects: ScenarioEffect[]; notes: string[] };
export type DailyCard = { sol: number; phase: string; phaseSummary: string; title: string; status: string; options: DailyOption[]; notes: string[] };
export type SpecialIntervention = { label: string; effects: ScenarioEffect[]; notes: string[] };
export type SpecialEventType = "dustStorm" | "panelIntervention" | "solarParticles" | "windCleaning" | "archive" | "quake";
export type SpecialEvent = { id: string; category: string; sourceHeading: string; startSol: number; endSol: number; type: SpecialEventType; title: string; when: string; content: string[]; initialEffects: ScenarioEffect[]; interventions: SpecialIntervention[]; scienceFactId: string | null; showBeforeDailyCard: boolean };
export type ScienceFact = { id: string; eventStartSol: number; title: string; description: string; source: string; sourceUrl: string | null };

const scenario = {
  "dailyCards": [
    {
      "sol": 1,
      "title": "ARES-7 Sistemlerini Devralma",
      "status": "ARES-7 daha önce kurulmuş bir araştırma üssüdür. Görevi devralırken hava, su ve güç sensörlerini ayrıntılı kontrol edebilir veya mevcut ayarlarla çalışmaya başlayabilirsin.",
      "options": [
        {
          "id": "A",
          "label": "Tam sistem kontrolünü yap.",
          "effects": [
            {
              "text": "Energy −6",
              "kind": "immediate"
            },
            {
              "text": "Kontrol odasında testler tamamlanır; doğrulanan sistemler işaretlenir.",
              "kind": "explanation"
            },
            {
              "text": "İlerideki etkisi: Sol 4’te valf sorununa müdahale daha az yaşam destek rezervi harcatır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Mevcut ayarlarla başla; ayrıntılı kontrolü ertele.",
          "effects": [
            {
              "text": "Energy −2",
              "kind": "immediate"
            },
            {
              "text": "Life Support −4",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −4",
              "kind": "immediate"
            },
            {
              "text": "Üs çalışmaya başlar; tamamlanmamış kontrol maddeleri ekranda kalır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 2,
      "title": "Sığınak Envanteri",
      "status": "Sığınağın su rezervleri, haberleşme cihazları ve izleme ekipmanının yeniden düzenlenmesi gerekiyor. Henüz acil bir tehlike bulunmuyor.",
      "options": [
        {
          "id": "A",
          "label": "Hazırlığı sonraki vardiyaya bırak.",
          "effects": [
            {
              "text": "Radiation Shield −6",
              "kind": "immediate"
            },
            {
              "text": "Sığınaktaki eksik hazırlıklar görünür kalır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Bugünkü vardiyayı sığınağı hazırlamaya ayır.",
          "effects": [
            {
              "text": "Energy −5",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −2",
              "kind": "immediate"
            },
            {
              "text": "Ekipman düzenlenir ve sistem kontrolleri yapılır.",
              "kind": "explanation"
            },
            {
              "text": "İlerideki etkisi: Sol 16’daki güneş parçacıkları olayında Shield kaybı −8 yerine −5 olur.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 3,
      "title": "Sera Aydınlatmasının Bakımı",
      "status": "Serada görevden önce yetiştirilmeye başlanmış bitkiler bulunuyor. Aydınlatma sisteminin bakımı, yaklaşan hasatta kullanılabilir ürün miktarını artırabilir.",
      "options": [
        {
          "id": "A",
          "label": "Aydınlatma bakımını ve ayarını şimdi yap.",
          "effects": [
            {
              "text": "Energy −8",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 7: Food +14",
              "kind": "delayed"
            },
            {
              "text": "Sera ekranına geçilir; armatürler kontrol edilir ve ışık dağılımı düzeltilir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Mevcut aydınlatmayla devam et.",
          "effects": [
            {
              "text": "Food −4",
              "kind": "immediate"
            },
            {
              "text": "Daha düşük kullanılabilir ürün beklentisi, gıda rezervi hesabına yansır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 4,
      "title": "Oksijen Hattında Valf Kontrolü",
      "status": "Sızdırmazlık testinde bir valfin bakım ihtiyacı görülüyor. Müdahale sırasında ilgili hattın kısa süreliğine ayrılması gerekiyor.",
      "options": [
        {
          "id": "A",
          "label": "Valfi değiştir ve hattı test et.",
          "effects": [
            {
              "text": "Energy −4",
              "kind": "immediate"
            },
            {
              "text": "Life Support −6",
              "kind": "immediate"
            },
            {
              "text": "Sol 1’de A seçildiyse: Life Support kaybı −6 yerine −3 olur.",
              "kind": "conditional"
            },
            {
              "text": "Bakım alanında hat izole edilir, valf değiştirilir ve test yapılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Geçici ayar yap; tam bakımı ertele.",
          "effects": [
            {
              "text": "Life Support −2",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 8: Life Support −12",
              "kind": "delayed"
            },
            {
              "text": "Sol 1’de A seçildiyse: Gecikmeli kayıp −12 yerine −8 olur.",
              "kind": "conditional"
            },
            {
              "text": "Geçici müdahale tamamlanır; tam bakım işi bekleyen görevlere eklenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 5,
      "title": "Panel Temizliği Planı",
      "status": "Güneş panellerindeki olağan toz birikimine karşı bakım zamanı geldi. Bu, henüz bir fırtına olayı değildir.",
      "options": [
        {
          "id": "A",
          "label": "Panel grubunu geçici ayırıp uzaktan temizlik yap.",
          "effects": [
            {
              "text": "Energy −7",
              "kind": "immediate"
            },
            {
              "text": "Panel alanına geçilir; robotik temizlik sistemi çalıştırılır.",
              "kind": "explanation"
            },
            {
              "text": "İlerideki etkisi: Temizlik düzeneği hazır kaldığı için Sol 11’deki fırtına sonrası temizlik Energy −5 yerine −3 harcar.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Üretimi sürdür; dış bakım ekibiyle kontrollü temizlik yap.",
          "effects": [
            {
              "text": "Energy −1",
              "kind": "immediate"
            },
            {
              "text": "Life Support −7",
              "kind": "immediate"
            },
            {
              "text": "Dış ekip hazırlanır; temizlik sırasında mürettebatın dış görev hizmetleri yaşam destek rezervinden karşılanır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 6,
      "title": "Dış İşin Önceliği",
      "status": "Planlı dış düzenleme işi ile sığınak hazırlığı aynı vardiyaya denk geliyor. Mürettebat iki işi de tam kapasiteyle tamamlayamıyor.",
      "options": [
        {
          "id": "A",
          "label": "Dış işi ertele; ekibi sığınak hazırlığına ayır.",
          "effects": [
            {
              "text": "Food −4",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −3",
              "kind": "immediate"
            },
            {
              "text": "Sığınakta hazırlık ilerler; dış iş beklemeye alınır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Dış işi yap; sığınak hazırlığını sınırlı bırak.",
          "effects": [
            {
              "text": "Radiation Shield −8",
              "kind": "immediate"
            },
            {
              "text": "Dış ekipman alanına geçilir; sığınağın ertelenen hazırlıkları işaretlenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 7,
      "title": "Su Geri Kazanım Filtresi",
      "status": "Su işleme hattının filtre bakım zamanı geliyor. Yeni filtrenin kurulumu ve doğrulama testleri birkaç sol sürecek.",
      "options": [
        {
          "id": "A",
          "label": "Yeni filtreyi tak ve doğrulama testlerini başlat.",
          "effects": [
            {
              "text": "Energy −7",
              "kind": "immediate"
            },
            {
              "text": "Food −3",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 11: Life Support +16",
              "kind": "delayed"
            },
            {
              "text": "Su modülünde filtre değiştirilir ve test süreci başlatılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Mevcut filtreye geçici bakım yap.",
          "effects": [
            {
              "text": "Life Support −3",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 11: Life Support −9, Food −4",
              "kind": "delayed"
            },
            {
              "text": "Geçici bakım yapılır; beklenen kapasite kaybı görev takviminde gösterilir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 8,
      "title": "Rasyon ve Bakım Vardiyası",
      "status": "Fırtına sırasında da gerekli üs bakımları devam ediyor. Ek bakım vardiyası öncesinde mürettebat için dinlenme ve ek öğün planlanabilir.",
      "options": [
        {
          "id": "A",
          "label": "Ek rasyonla dinlenme arası ver; sonraki bakım vardiyasını koru.",
          "effects": [
            {
              "text": "Food −7",
              "kind": "immediate"
            },
            {
              "text": "Yaşam alanında öğün ve dinlenme düzenlenir; bakım takvimi korunur.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Ek rasyon ayırma; bakım programını daha sınırlı yürüt.",
          "effects": [
            {
              "text": "Life Support −5",
              "kind": "immediate"
            },
            {
              "text": "Bazı yaşam destek bakım işleri ertelenir.",
              "kind": "explanation"
            }
          ],
          "notes": [
            "Hatırlatma: Bu kartın etkilerine ek olarak, o solun fırtına etkisi ve varsa Sol 4’ten gelen gecikmeli etki uygulanır."
          ]
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 9,
      "title": "Korunaklı Çalışma Planı",
      "status": "Fırtına devam ederken günlük işler korunaklı alan içinde yeniden düzenlenebilir.",
      "options": [
        {
          "id": "A",
          "label": "Enerji ayırıp korunaklı çalışma düzenini kur.",
          "effects": [
            {
              "text": "Energy −5",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −3",
              "kind": "immediate"
            },
            {
              "text": "Korunaklı alandaki izleme ve çalışma ekipmanları hazırlanır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Hazırlığı sınırlı tut; mevcut düzenle devam et.",
          "effects": [
            {
              "text": "Radiation Shield −10",
              "kind": "immediate"
            },
            {
              "text": "Koruma hazırlığındaki eksikler görünür kalır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 10,
      "title": "Acil Durum Alarm Testi",
      "status": "Üs içi alarm ve haberleşme hattının kabul testi planlanıyor. Test tamamlandığında sığınak koordinasyon hazırlığı iyileşecek.",
      "options": [
        {
          "id": "A",
          "label": "Yedek alarm hattını kur ve test programını başlat.",
          "effects": [
            {
              "text": "Energy −6",
              "kind": "immediate"
            },
            {
              "text": "Life Support −2",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 14: Radiation Shield +12",
              "kind": "delayed"
            },
            {
              "text": "Kontrol odası ve sığınak arasındaki alarm bağlantıları sırayla test edilir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Mevcut hatla çalışmayı sürdür.",
          "effects": [
            {
              "text": "Life Support −4",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −3",
              "kind": "immediate"
            },
            {
              "text": "Yedek bağlantı hazırlığı beklemeye alınır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KURULUM VE İLK SINAVLAR",
      "phaseSummary": "Sol 1–10 · 10 temel karar"
    },
    {
      "sol": 11,
      "title": "Sığınak Hizmetlerinin Paylaşılması",
      "status": "Sığınak bölümünün havalandırma ve güç testleri, günlük üs işleriyle aynı kaynakları kullanacak.",
      "options": [
        {
          "id": "A",
          "label": "Korunaklı alanda kapsamlı test yap.",
          "effects": [
            {
              "text": "Energy −7",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −3",
              "kind": "immediate"
            },
            {
              "text": "Sığınak hizmetleri test moduna alınır ve ölçümler izlenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Kısmi test yap; yaşam destek bakımını da sınırla.",
          "effects": [
            {
              "text": "Life Support −3",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −8",
              "kind": "immediate"
            },
            {
              "text": "Bazı kontrol adımları ertelenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 12,
      "title": "Sera Isıtma Hattı",
      "status": "Sera ısıtma hattının bakımı gerekiyor. İşlem için enerji ve kısa süreli üretim kısıtı gerekli.",
      "options": [
        {
          "id": "A",
          "label": "Isıtma hattının bakımını şimdi tamamla.",
          "effects": [
            {
              "text": "Energy −6",
              "kind": "immediate"
            },
            {
              "text": "Food −3",
              "kind": "immediate"
            },
            {
              "text": "Seranın ilgili bölümü kısa süreliğine izole edilir ve ısıtma kontrolü yapılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Mevcut hatla devam et; bakımı sonraya bırak.",
          "effects": [
            {
              "text": "Food −3",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 15: Food −12",
              "kind": "delayed"
            },
            {
              "text": "Isıtma performansının düşmesi, ileride ek ürün kaybına yol açar.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 13,
      "title": "Su ve Gıda Hazırlama Modülü",
      "status": "Üste bulunan yedek su işleme ve gıda hazırlama modülü henüz kullanıma hazır değildir. Testler tamamlanırsa kullanılabilir su hizmetleri ve hazırlanabilir öğün rezervi toparlanacak.",
      "options": [
        {
          "id": "A",
          "label": "Yedek modülün kurulum ve kabul testlerini başlat.",
          "effects": [
            {
              "text": "Energy −9",
              "kind": "immediate"
            },
            {
              "text": "Life Support −3",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 17: Food +10, Life Support +12",
              "kind": "delayed"
            },
            {
              "text": "Yedek modül bağlanır ve devreye alma takvimi açılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Ana hat ve mevcut hazır gıda rezerviyle devam et.",
          "effects": [
            {
              "text": "Food −5",
              "kind": "immediate"
            },
            {
              "text": "Yedek modül kapalı kalır; ana sistemin iş yükü sürer.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 14,
      "title": "Toza Karşı Bakım Bütçesi",
      "status": "Fırtınanın ardından dış ekipmanların bağlantı ve hareketli parçaları için önleyici bakım gerekiyor. Bu kart yeni bir fırtına başlatmaz.",
      "options": [
        {
          "id": "A",
          "label": "Enerjiyi kritik hizmetlere ve uzaktan bakıma ayır.",
          "effects": [
            {
              "text": "Energy −5",
              "kind": "immediate"
            },
            {
              "text": "Life Support −3",
              "kind": "immediate"
            },
            {
              "text": "Kritik hizmetler önceliklendirilir; dış ekipman robotik olarak incelenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Sera faaliyetini koru; daha fazla dış ekip çalışması planla.",
          "effects": [
            {
              "text": "Energy −1",
              "kind": "immediate"
            },
            {
              "text": "Life Support −5",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −5",
              "kind": "immediate"
            },
            {
              "text": "Sera çalışmayı sürdürür; dış görev hazırlığı ek hizmet rezervi kullanır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 15,
      "title": "Kullanılacak Yaşam Alanı",
      "status": "Korunaklı bölümün hizmetleri ile ana yaşam alanının ihtiyaçları arasında kaynak paylaşımı yapılması gerekiyor.",
      "options": [
        {
          "id": "A",
          "label": "Daha geniş korunaklı alanı hizmette tut.",
          "effects": [
            {
              "text": "Energy −4",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −6",
              "kind": "immediate"
            },
            {
              "text": "Geniş bölümün havalandırma, izleme ve koruma hizmetleri çalışmayı sürdürür.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Daha küçük alanı kullan; su ve öğün hizmetlerini geçici sınırla.",
          "effects": [
            {
              "text": "Food −4",
              "kind": "immediate"
            },
            {
              "text": "Life Support −6",
              "kind": "immediate"
            },
            {
              "text": "Kullanılmayan bölüm kapatılır; mürettebat küçük alana geçer.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 16,
      "title": "Batarya Modülünün Durumu",
      "status": "Bir batarya modülünün rutin ölçümleri ayrıntılı inceleme gerektiriyor. Modül izole ediliyor; kalıcı çözüm için kaynak ayırmak gerekiyor.",
      "options": [
        {
          "id": "A",
          "label": "Modülü ayır ve yedek kapasiteye geç.",
          "effects": [
            {
              "text": "Energy −9",
              "kind": "immediate"
            },
            {
              "text": "Enerji bölümünde yedek kapasite devreye alınır; kullanılabilir rezerv azalır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Modülü ayrı test düzeninde tut; kalıcı çözümü ertele.",
          "effects": [
            {
              "text": "Anlık kaynak değişimi: 0",
              "kind": "explanation"
            },
            {
              "text": "Gecikmeli etki — Sol 19: Energy −14, Radiation Shield −5",
              "kind": "delayed"
            },
            {
              "text": "Sonraki müdahale ve hizmet kısıtı görev takviminde gösterilir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 17,
      "title": "Mürettebat ve Bakım Kapasitesi",
      "status": "Yoğun görev programı nedeniyle mürettebat her bakım işini aynı vardiyada tamamlayamıyor.",
      "options": [
        {
          "id": "A",
          "label": "Ek rasyon ve dinlenmeyle tam bakım vardiyasını destekle.",
          "effects": [
            {
              "text": "Energy −1",
              "kind": "immediate"
            },
            {
              "text": "Food −8",
              "kind": "immediate"
            },
            {
              "text": "Öğün ve vardiya planı güncellenir; bakım programı korunur.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Bakım vardiyasını küçült; bazı yaşam destek işlerini ertele.",
          "effects": [
            {
              "text": "Life Support −9",
              "kind": "immediate"
            },
            {
              "text": "Ertelenen yaşam destek kontrolleri sistem ekranında işaretlenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 18,
      "title": "Koruma Ekipmanının Önceliği",
      "status": "Korunaklı alanın izleme, haberleşme ve hizmet ekipmanına ayrılabilecek bakım kapasitesi sınırlı.",
      "options": [
        {
          "id": "A",
          "label": "Koruma hazırlığı işlerine öncelik ver.",
          "effects": [
            {
              "text": "Radiation Shield −10",
              "kind": "immediate"
            },
            {
              "text": "Kontroller sırasında mevcut koruma ekipmanı ve hazırlık rezervi kullanılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Enerji ve yaşam destek hizmetlerini düşük faaliyet düzeninde yürüt.",
          "effects": [
            {
              "text": "Energy −4",
              "kind": "immediate"
            },
            {
              "text": "Life Support −5",
              "kind": "immediate"
            },
            {
              "text": "Üs hizmetlerinin çalışma düzeni değiştirilir; bazı işler sınırlandırılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 19,
      "title": "Karbondioksit Temizleme Ünitesi",
      "status": "Hava işleme ünitesinin periyodik bakım aralığı doluyor. Sistemi planlı olarak ayırmak enerji ve yaşam destek rezervi gerektiriyor.",
      "options": [
        {
          "id": "A",
          "label": "Üniteye bakım yap ve işlev kontrolünü tamamla.",
          "effects": [
            {
              "text": "Energy −5",
              "kind": "immediate"
            },
            {
              "text": "Life Support −3",
              "kind": "immediate"
            },
            {
              "text": "Hava işleme bölümünde bakım yapılır ve sistem yeniden test edilir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Mevcut üniteyi izlemeyi sürdür; bakımı ertele.",
          "effects": [
            {
              "text": "Life Support −2",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 22: Life Support −8",
              "kind": "delayed"
            },
            {
              "text": "Gecikmeli kapasite kaybı görev takviminde gösterilir.",
              "kind": "delayed"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 20,
      "title": "Yedek Sistemleri Devreye Alma",
      "status": "Görevin son dönemi için yedek güç ve su hizmetlerinin birlikte kabul testine alınması öneriliyor.",
      "options": [
        {
          "id": "A",
          "label": "Test programına şimdi kaynak ayır.",
          "effects": [
            {
              "text": "Energy −7",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −3",
              "kind": "immediate"
            },
            {
              "text": "Gecikmeli etki — Sol 25: Energy +12, Life Support +8",
              "kind": "delayed"
            },
            {
              "text": "Yedek sistemler testleri tamamlandığında kullanılabilir hâle gelir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Mevcut güç ve yaşam destek düzeniyle devam et.",
          "effects": [
            {
              "text": "Life Support −5",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −4",
              "kind": "immediate"
            },
            {
              "text": "Yedek sistemler beklemede kalır; ana sistemlerin yükü sürer.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "KAYNAK BASKISI VE GECİKMELİ SONUÇLAR",
      "phaseSummary": "Sol 11–20 · 10 orta karar"
    },
    {
      "sol": 21,
      "title": "Son Dönem Koruma Planı",
      "status": "Kalan sollar için dış bakım programı ile korunaklı yaşam düzeni birlikte planlanıyor.",
      "options": [
        {
          "id": "A",
          "label": "Koruma ekipmanı ve dış iş hazırlığına kaynak ayır.",
          "effects": [
            {
              "text": "Energy −2",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −10",
              "kind": "immediate"
            },
            {
              "text": "Koruma ekipmanı hazırlanır ve dış görev kontrol listeleri tamamlanır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Daha dar yaşam alanında kal; dış işleri azalt.",
          "effects": [
            {
              "text": "Food −5",
              "kind": "immediate"
            },
            {
              "text": "Life Support −7",
              "kind": "immediate"
            },
            {
              "text": "Mürettebat küçük yaşam alanına geçer; dış görevler azaltılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 22,
      "title": "Panel ve Sera Bütçesi",
      "status": "Panel bakımına ayrılacak enerji ile mevcut bitkilerin aydınlatma ihtiyacı aynı rezervden karşılanıyor.",
      "options": [
        {
          "id": "A",
          "label": "Panel grubunu bakım için ayır; sera ışık programını kısalt.",
          "effects": [
            {
              "text": "Energy −8",
              "kind": "immediate"
            },
            {
              "text": "Food −3",
              "kind": "immediate"
            },
            {
              "text": "Panel alanında bakım yapılır; sera ışıkları daha kısa süre çalışır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Sera aydınlatmasını koru; daha fazla batarya enerjisi kullan.",
          "effects": [
            {
              "text": "Energy −11",
              "kind": "immediate"
            },
            {
              "text": "Sera ışıkları açık kalır; enerji rezervi daha hızlı azalır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 23,
      "title": "Dış Bağlantıların Bakımı",
      "status": "Deprem müdahalesinin ardından günlük programdaki dış bağlantı bakımı da bekliyor. Bu iş, depremde izole edilen iç yardımcı hattın onarımından ayrıdır.",
      "options": [
        {
          "id": "A",
          "label": "Dış bakım ekibini gönder ve bağlantıları kontrol et.",
          "effects": [
            {
              "text": "Energy −6",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −5",
              "kind": "immediate"
            },
            {
              "text": "Dış bağlantı alanına geçilir ve planlı bakım gerçekleştirilir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "İlgili bölümü kontrollü kapat; dış bakımı ertele.",
          "effects": [
            {
              "text": "Food −4",
              "kind": "immediate"
            },
            {
              "text": "Life Support −8",
              "kind": "immediate"
            },
            {
              "text": "Bölümün hizmetleri kapatılır; kullanılabilir alan ve hizmet kapasitesi azalır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 24,
      "title": "Korunaklı Bölümün İşletilmesi",
      "status": "Korunaklı bölümün işletimi ile ana yaşam alanının hizmetleri arasında kaynak paylaşımı gerekiyor.",
      "options": [
        {
          "id": "A",
          "label": "Korunaklı bölümün hizmet kapasitesini koru.",
          "effects": [
            {
              "text": "Energy −3",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −10",
              "kind": "immediate"
            },
            {
              "text": "Sığınak hizmetleri çalışmayı sürdürür; ekipman ve hazırlık rezervi kullanılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Kullanılan alanı küçült; bazı hizmetleri kısıtla.",
          "effects": [
            {
              "text": "Life Support −9",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −4",
              "kind": "immediate"
            },
            {
              "text": "Kullanılmayan bölümler kapanır ve mürettebatın yaşam alanı yeniden düzenlenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 25,
      "title": "Son Hafta Görev Yükü",
      "status": "Kalan bakım işleri için ekip ve öğün planını yeniden düzenlemek gerekiyor.",
      "options": [
        {
          "id": "A",
          "label": "Ek rasyon ve dinlenmeyle bakım ekibini destekle.",
          "effects": [
            {
              "text": "Energy −2",
              "kind": "immediate"
            },
            {
              "text": "Food −9",
              "kind": "immediate"
            },
            {
              "text": "Öğün ve vardiya planı güncellenir; bakım programı korunur.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "İş yükünü azalt; bazı koruma ve yaşam destek bakımlarını ertele.",
          "effects": [
            {
              "text": "Life Support −7",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −4",
              "kind": "immediate"
            },
            {
              "text": "Ertelenen işler sistem ekranında işaretlenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 26,
      "title": "Koruma Bakımı mı, Gıda Hazırlığı mı?",
      "status": "Bugünkü çalışma aralığı hem koruma ekipmanına hem gıda hazırlama faaliyetlerine yetmiyor.",
      "options": [
        {
          "id": "A",
          "label": "Koruma işlerinde mevcut ekipman rezervini kullan; yaşam destek bakımını azalt.",
          "effects": [
            {
              "text": "Life Support −3",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −9",
              "kind": "immediate"
            },
            {
              "text": "Koruma ekipmanı kullanılır; bazı yaşam destek işleri ertelenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Ek bakım enerjisi ayır; bazı gıda hazırlama işlerini ertele.",
          "effects": [
            {
              "text": "Energy −7",
              "kind": "immediate"
            },
            {
              "text": "Food −5",
              "kind": "immediate"
            },
            {
              "text": "Bakım sahnesi açılır; hazırlanmayı bekleyen öğünler kullanılabilir gıda hesabından ayrılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 27,
      "title": "Su Tankı Bağlantısının Kontrolü",
      "status": "Tank hattının test ve bakımında su hizmetlerinin geçici olarak yeniden düzenlenmesi gerekiyor.",
      "options": [
        {
          "id": "A",
          "label": "Yedek tankı bağla ve ana bağlantıyı kontrol et.",
          "effects": [
            {
              "text": "Energy −4",
              "kind": "immediate"
            },
            {
              "text": "Life Support −7",
              "kind": "immediate"
            },
            {
              "text": "Su bölümünde yedek tank devreye alınır ve bağlantı testi yapılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Yedek bağlantıyı ertele; su kullanımını ve öğün hazırlamayı sınırla.",
          "effects": [
            {
              "text": "Food −8",
              "kind": "immediate"
            },
            {
              "text": "Life Support −4",
              "kind": "immediate"
            },
            {
              "text": "Su kullanım sınırları ve hazırlanabilir öğün miktarı güncellenir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 28,
      "title": "Görev Sonuna Kadar Çalışma Düzeni",
      "status": "Mürettebat, kalan kritik hizmetleri korunaklı çalışma düzeniyle veya düşük faaliyet moduyla sürdürebilir.",
      "options": [
        {
          "id": "A",
          "label": "Korunaklı çalışma düzenini mevcut kaynaklarla sürdür.",
          "effects": [
            {
              "text": "Energy −2",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −12",
              "kind": "immediate"
            },
            {
              "text": "Korunaklı bölümdeki hizmetler çalışmaya devam eder; kalan hazırlık rezervi kullanılır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Düşük faaliyet moduna geç; bazı yaşam ve gıda hizmetlerini sınırla.",
          "effects": [
            {
              "text": "Food −6",
              "kind": "immediate"
            },
            {
              "text": "Life Support −9",
              "kind": "immediate"
            },
            {
              "text": "Önemsiz ekipman kapanır; kullanılan yaşam ve gıda hazırlama alanları daralır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 29,
      "title": "Planlı Ayrılışa Hazırlık",
      "status": "Görevden önce üste yerleştirilmiş dönüş aracı için son hazırlıklar yapılacak.",
      "options": [
        {
          "id": "A",
          "label": "Dış bağlantı ve erişim altyapısını hazırla.",
          "effects": [
            {
              "text": "Energy −7",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −4",
              "kind": "immediate"
            },
            {
              "text": "Dönüş aracına erişim güzergâhı ve bağlantıları kontrol edilir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Ekibi hava kilidinde hazır tut; dış hazırlığı sınırlı yürüt.",
          "effects": [
            {
              "text": "Food −4",
              "kind": "immediate"
            },
            {
              "text": "Life Support −8",
              "kind": "immediate"
            },
            {
              "text": "Mürettebat hava kilidinde hazırlanır; geçici hizmet düzeni kaynak tüketir.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    },
    {
      "sol": 30,
      "title": "Son Yük ve Hizmet Kararı",
      "status": "Dönüş aracının önceden doğrulanmış güvenli sınırları içinde son yük ve hizmet planı seçilecek. Mürettebatın güvenli dönüşü için gerekli rezervler korunur.",
      "options": [
        {
          "id": "A",
          "label": "Planlı yük düzeniyle enerji yoğun hazırlığı tamamla.",
          "effects": [
            {
              "text": "Energy −8",
              "kind": "immediate"
            },
            {
              "text": "Radiation Shield −4",
              "kind": "immediate"
            },
            {
              "text": "Araç hazırlığı ve son görev kontrol listesi tamamlanır.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "id": "B",
          "label": "Gereksiz yükü üste bırak; son hizmet planını küçült.",
          "effects": [
            {
              "text": "Food −8",
              "kind": "immediate"
            },
            {
              "text": "Life Support −5",
              "kind": "immediate"
            },
            {
              "text": "Görev dışı yük ve üste bırakılan kullanılabilir rezervler üs hesabından çıkarılır; zorunlu dönüş rezervleri korunur.",
              "kind": "explanation"
            }
          ],
          "notes": []
        }
      ],
      "notes": [
        "Son kontrol:",
        "Kart etkisinden ve günlük Food −1 tüketiminden sonra bütün barlar 0’ın üzerindeyse görev başarıyla tamamlanır."
      ],
      "phase": "SON HAFTA VE AYRILIŞ",
      "phaseSummary": "Sol 21–30 · 10 zor karar"
    }
  ],
  "specialEvents": [
    {
      "id": "event-8",
      "startSol": 8,
      "endSol": 10,
      "type": "dustStorm",
      "title": "BÜYÜK TOZ FIRTINASI",
      "when": "Sol 8’de başlar, Sol 10 sonuna kadar sürer.",
      "content": [
        "Sol 8’de başlar, Sol 10 sonuna kadar sürer.",
        "Sahne:",
        "Gökyüzü kararır. Görüş azalır, panel üretimi düşer ve üs enerji tasarrufuna geçer. Sera aydınlatmasının kısılması, hasada yakın ürünlerin bir bölümünü kullanılmaz hâle getirir.",
        "Kaynak etkileri:",
        "- Sol 8: Energy −2, Food −3",
        "- Sol 9: Energy −2",
        "- Sol 10: Energy −2",
        "- Toplam fırtına etkisi: Energy −6, Food −3",
        "Food kaybı bir kez uygulanır. Bu kayıp, kapalı gıda depolarına kum girmesinden değil, sera üretiminin aksamasından kaynaklanır.",
        "Yandan açılan bilim kutusu:",
        "Gerçek Mars kaydı — Opportunity, 2018",
        "Opportunity, gezegeni kaplayan toz fırtınasında güneş enerjisi kaybetti. Araçtan alınan son iletişim 10 Haziran 2018 tarihindeydi. ARES-7’nin sera kaybı ve oyun puanları bu kayıttan esinlenen senaryo uyarlamasıdır.",
        "Kaynak: NASA — Opportunity"
      ],
      "initialEffects": [
        {
          "text": "Sol 8: Energy −2, Food −3",
          "kind": "explanation"
        },
        {
          "text": "Sol 9: Energy −2",
          "kind": "explanation"
        },
        {
          "text": "Sol 10: Energy −2",
          "kind": "explanation"
        },
        {
          "text": "Toplam fırtına etkisi: Energy −6, Food −3",
          "kind": "explanation"
        }
      ],
      "interventions": [],
      "scienceFactId": "science-8",
      "showBeforeDailyCard": true,
      "sourceHeading": "⚠️ BEKLENMEDİK OLAY 1 — BÜYÜK TOZ FIRTINASI",
      "category": "BEKLENMEDİK OLAY 1"
    },
    {
      "id": "event-11",
      "startSol": 11,
      "endSol": 11,
      "type": "panelIntervention",
      "title": "TOZLU PANELLER",
      "when": "Sol 11’de, günlük karttan önce açılan müdahale sahnesi.",
      "content": [
        "Sol 11’de, günlük karttan önce açılan müdahale sahnesi.",
        "Durum:",
        "Atmosferdeki fırtına hafiflemiştir; ancak ana güneş panellerinin yüzeyinde toz kalmıştır. Gökyüzünün açılması tek başına üretimi tamamen düzeltmez.",
        "Müdahale — Ana panelleri temizle.",
        "- Energy −5",
        "- Sol 5’te A seçildiyse: Energy −3",
        "- Panel alanına geçilir ve temizlik animasyonu oynar.",
        "- Yüzey tozundan kaynaklanan günlük enerji kaybı durur.",
        "Müdahaleyi ertele.",
        "- O anda temizlik enerjisi harcanmaz.",
        "- Temizlenmediği her sol Energy −2 uygulanır.",
        "- Hiç temizlenmezse bu kayıp Sol 11–18 boyunca, toplam Energy −16 olur.",
        "- Sol 19’daki rüzgâr kalan yüzey tozunu kaldırır.",
        "Önemli: Temizlik, geçmiş fırtınanın enerji kaybını geri vermez; yalnızca sonraki üretim kaybını durdurur."
      ],
      "initialEffects": [],
      "interventions": [
        {
          "label": "Ana panelleri temizle",
          "effects": [
            {
              "text": "Energy −5",
              "kind": "immediate"
            },
            {
              "text": "Sol 5’te A seçildiyse: Energy −3",
              "kind": "conditional"
            },
            {
              "text": "Panel alanına geçilir ve temizlik animasyonu oynar.",
              "kind": "explanation"
            },
            {
              "text": "Yüzey tozundan kaynaklanan günlük enerji kaybı durur.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "label": "Müdahaleyi ertele",
          "effects": [
            {
              "text": "O anda temizlik enerjisi harcanmaz.",
              "kind": "explanation"
            },
            {
              "text": "Temizlenmediği her sol Energy −2 uygulanır.",
              "kind": "explanation"
            },
            {
              "text": "Hiç temizlenmezse bu kayıp Sol 11–18 boyunca, toplam Energy −16 olur.",
              "kind": "explanation"
            },
            {
              "text": "Sol 19’daki rüzgâr kalan yüzey tozunu kaldırır.",
              "kind": "explanation"
            }
          ],
          "notes": [
            "Önemli: Temizlik, geçmiş fırtınanın enerji kaybını geri vermez; yalnızca sonraki üretim kaybını durdurur."
          ]
        }
      ],
      "scienceFactId": null,
      "showBeforeDailyCard": true,
      "sourceHeading": "🧹 FIRTINANIN DEVAMI — TOZLU PANELLER",
      "category": "FIRTINANIN DEVAMI"
    },
    {
      "id": "event-16",
      "startSol": 16,
      "endSol": 16,
      "type": "solarParticles",
      "title": "MARS’A ULAŞAN GÜNEŞ PARÇACIKLARI",
      "when": "Sol 16’da, günlük karttan önce gerçekleşir.",
      "content": [
        "Sol 16’da, günlük karttan önce gerçekleşir.",
        "Sahne:",
        "Radyasyon uyarısı devreye girer. Dış görevler durdurulur, mürettebat korunaklı bölüme geçer ve üs ekranlarında kırmızı alarm görünür.",
        "Kaynak etkisi:",
        "- Radiation Shield −8",
        "- Sol 2’de B seçildiyse: Radiation Shield −5",
        "Bu kayıp, koruma hazırlığı ve kullanılabilir güvenlik rezervinin azalmasını temsil eder. Radyasyonun duvarları fiziksel olarak tükettiği anlamına gelmez.",
        "Yandan açılan bilim kutusu:",
        "Gerçek Mars kaydı — Curiosity, 20 Mayıs 2024",
        "Curiosity’nin RAD cihazı, Mars yüzeyine ulaşan güneş parçacıkları sırasında radyasyon artışı ölçtü. Oyundaki Shield puanı bir radyasyon dozu değildir. DONKI kaydından doğrudan Mars yüzey dozu hesaplanmaz.",
        "Kaynak: NASA/JPL — Mars’taki güneş fırtınası"
      ],
      "initialEffects": [
        {
          "text": "Radiation Shield −8",
          "kind": "immediate"
        },
        {
          "text": "Sol 2’de B seçildiyse: Radiation Shield −5",
          "kind": "conditional"
        }
      ],
      "interventions": [],
      "scienceFactId": "science-16",
      "showBeforeDailyCard": true,
      "sourceHeading": "☀️ BEKLENMEDİK OLAY 2 — MARS’A ULAŞAN GÜNEŞ PARÇACIKLARI",
      "category": "BEKLENMEDİK OLAY 2"
    },
    {
      "id": "event-19",
      "startSol": 19,
      "endSol": 19,
      "type": "windCleaning",
      "title": "RÜZGÂRLA PANEL TEMİZLENMESİ",
      "when": "Sol 19’da, günlük karttan önce gerçekleşir.",
      "content": [
        "Sol 19’da, günlük karttan önce gerçekleşir.",
        "Sahne:",
        "Rüzgâr, yardımcı güneş paneli dizisindeki artık tozu kaldırır. Ana paneller temizlenmemişse onların üzerindeki birikim de azalır ve üretim toparlanır.",
        "Kaynak etkisi:",
        "- Bir kez Energy +4",
        "- Temizlenmemiş panellerden gelen günlük Energy −2 kaybı sona erer.",
        "- +4 her sol tekrarlanmaz.",
        "Manuel temizlik ana panel dizisini temizlerken bu olumlu olay, erişilemeyen yardımcı panel dizisindeki tozu da kaldırır. Böylece aynı temizliğe iki kez ödül verilmez.",
        "Yandan açılan bilim kutusu:",
        "Gerçek Mars kaydı — Spirit, Mart 2005",
        "Spirit’in güneş panellerindeki tozun rüzgârla temizlenmesi, enerji üretimini artırdı. Oyundaki +4 puan, bu ölçümün doğrudan sayısal karşılığı değildir.",
        "Kaynak: NASA — Spirit"
      ],
      "initialEffects": [
        {
          "text": "Bir kez Energy +4",
          "kind": "immediate"
        },
        {
          "text": "Temizlenmemiş panellerden gelen günlük Energy −2 kaybı sona erer.",
          "kind": "explanation"
        },
        {
          "text": "+4 her sol tekrarlanmaz.",
          "kind": "explanation"
        }
      ],
      "interventions": [],
      "scienceFactId": "science-19",
      "showBeforeDailyCard": true,
      "sourceHeading": "🌬️ OLUMLU SÜRPRİZ — RÜZGÂRLA PANEL TEMİZLENMESİ",
      "category": "OLUMLU SÜRPRİZ"
    },
    {
      "id": "event-21",
      "startSol": 21,
      "endSol": 21,
      "type": "archive",
      "title": "MARS’TA METEOROİD ÇARPMASI",
      "when": "Sol 21’de, günlük karttan önce gösterilir.",
      "content": [
        "Sol 21’de, günlük karttan önce gösterilir.",
        "Sahne:",
        "Görev kontrol ekranında bir arşiv gözlemi açılır. Mars yüzeyindeki krater görüntüsü ve ilgili sismik kayıt gösterilir.",
        "Bu sahne, üssün yakınına yeni bir meteoroid düştüğü anlamına gelmez. Mürettebat gerçek bir Mars olayını öğrenir.",
        "Kaynak etkisi:",
        "- Energy 0",
        "- Food 0",
        "- Life Support 0",
        "- Radiation Shield 0",
        "- Onarım veya müdahale gerekmez.",
        "Yandan açılan bilim kutusu:",
        "Gerçek Mars kaydı — 24 Aralık 2021",
        "Mars’a çarpan bir meteoroidin oluşturduğu olay, InSight’ın sismik kayıtları ve Mars Reconnaissance Orbiter görüntüleriyle araştırıldı. Sonuçlar 27 Ekim 2022’de yayımlandı.",
        "Kaynak: NASA — InSight ve meteoroid çarpması"
      ],
      "initialEffects": [
        {
          "text": "Energy 0",
          "kind": "immediate"
        },
        {
          "text": "Food 0",
          "kind": "immediate"
        },
        {
          "text": "Life Support 0",
          "kind": "immediate"
        },
        {
          "text": "Radiation Shield 0",
          "kind": "immediate"
        },
        {
          "text": "Onarım veya müdahale gerekmez.",
          "kind": "explanation"
        }
      ],
      "interventions": [],
      "scienceFactId": "science-21",
      "showBeforeDailyCard": true,
      "sourceHeading": "☄️ BİLGİLENDİRME SAHNESİ — MARS’TA METEOROİD ÇARPMASI",
      "category": "BİLGİLENDİRME SAHNESİ"
    },
    {
      "id": "event-23",
      "startSol": 23,
      "endSol": 23,
      "type": "quake",
      "title": "MARS DEPREMİ",
      "when": "Sol 23’te, günlük karttan önce gerçekleşir.",
      "content": [
        "Sol 23’te, günlük karttan önce gerçekleşir.",
        "Sahne:",
        "Üs kısa süreliğine sarsılır. Bir yaşam destek yardımcı hattı güvenlik amacıyla izole edilir. Korunaklı bölümdeki bazı bağlantılar kontrol bekler.",
        "Oyuncu uyarı ekranından ilgili bakım alanını seçer ve o bölgeye geçer.",
        "Olayın ilk etkisi:",
        "- Life Support −3",
        "- Radiation Shield −4",
        "Müdahale — Bağlantıları onar ve sistem testini tamamla.",
        "- Energy −4",
        "- Onarım tamamlandığında Radiation Shield +4",
        "- Olay sırasında kullanılan Life Support −3 geri gelmez.",
        "- Ek günlük kayıp durur.",
        "Müdahaleyi ertele.",
        "- O anda onarım enerjisi harcanmaz.",
        "- Shield kaybı devam eder.",
        "- Sol 23 dâhil, onarım yapılmadığı her sol Life Support −1 uygulanır.",
        "Yandan açılan bilim kutusu:",
        "Gerçek Mars kaydı — InSight, 4 Mayıs 2022",
        "InSight, Mars’ta güçlü bir deprem kaydetti. ARES-7’deki bağlantı ve yardımcı ekipman hasarı, bu kayıttan esinlenen varsayımsal oyun senaryosudur. NASA’nın gözlemlediği bir insan üssü hasarı değildir.",
        "Kaynak: NASA — InSight’ın büyük Mars depremi kaydı"
      ],
      "initialEffects": [
        {
          "text": "Life Support −3",
          "kind": "immediate"
        },
        {
          "text": "Radiation Shield −4",
          "kind": "immediate"
        }
      ],
      "interventions": [
        {
          "label": "Bağlantıları onar ve sistem testini tamamla",
          "effects": [
            {
              "text": "Energy −4",
              "kind": "immediate"
            },
            {
              "text": "Onarım tamamlandığında Radiation Shield +4",
              "kind": "explanation"
            },
            {
              "text": "Olay sırasında kullanılan Life Support −3 geri gelmez.",
              "kind": "explanation"
            },
            {
              "text": "Ek günlük kayıp durur.",
              "kind": "explanation"
            }
          ],
          "notes": []
        },
        {
          "label": "Müdahaleyi ertele",
          "effects": [
            {
              "text": "O anda onarım enerjisi harcanmaz.",
              "kind": "explanation"
            },
            {
              "text": "Shield kaybı devam eder.",
              "kind": "explanation"
            },
            {
              "text": "Sol 23 dâhil, onarım yapılmadığı her sol Life Support −1 uygulanır.",
              "kind": "explanation"
            }
          ],
          "notes": [
            "InSight, Mars’ta güçlü bir deprem kaydetti. ARES-7’deki bağlantı ve yardımcı ekipman hasarı, bu kayıttan esinlenen varsayımsal oyun senaryosudur. NASA’nın gözlemlediği bir insan üssü hasarı değildir."
          ]
        }
      ],
      "scienceFactId": "science-23",
      "showBeforeDailyCard": true,
      "sourceHeading": "🌋 BEKLENMEDİK OLAY 3 — MARS DEPREMİ",
      "category": "BEKLENMEDİK OLAY 3"
    }
  ],
  "scienceFacts": [
    {
      "id": "science-8",
      "eventStartSol": 8,
      "title": "Gerçek Mars kaydı — Opportunity, 2018",
      "description": "Opportunity, gezegeni kaplayan toz fırtınasında güneş enerjisi kaybetti. Araçtan alınan son iletişim 10 Haziran 2018 tarihindeydi. ARES-7’nin sera kaybı ve oyun puanları bu kayıttan esinlenen senaryo uyarlamasıdır.",
      "source": "NASA — Opportunity",
      "sourceUrl": null
    },
    {
      "id": "science-16",
      "eventStartSol": 16,
      "title": "Gerçek Mars kaydı — Curiosity, 20 Mayıs 2024",
      "description": "Curiosity’nin RAD cihazı, Mars yüzeyine ulaşan güneş parçacıkları sırasında radyasyon artışı ölçtü. Oyundaki Shield puanı bir radyasyon dozu değildir. DONKI kaydından doğrudan Mars yüzey dozu hesaplanmaz.",
      "source": "NASA/JPL — Mars’taki güneş fırtınası",
      "sourceUrl": null
    },
    {
      "id": "science-19",
      "eventStartSol": 19,
      "title": "Gerçek Mars kaydı — Spirit, Mart 2005",
      "description": "Spirit’in güneş panellerindeki tozun rüzgârla temizlenmesi, enerji üretimini artırdı. Oyundaki +4 puan, bu ölçümün doğrudan sayısal karşılığı değildir.",
      "source": "NASA — Spirit",
      "sourceUrl": null
    },
    {
      "id": "science-21",
      "eventStartSol": 21,
      "title": "Gerçek Mars kaydı — 24 Aralık 2021",
      "description": "Mars’a çarpan bir meteoroidin oluşturduğu olay, InSight’ın sismik kayıtları ve Mars Reconnaissance Orbiter görüntüleriyle araştırıldı. Sonuçlar 27 Ekim 2022’de yayımlandı.",
      "source": "NASA — InSight ve meteoroid çarpması",
      "sourceUrl": null
    },
    {
      "id": "science-23",
      "eventStartSol": 23,
      "title": "Gerçek Mars kaydı — InSight, 4 Mayıs 2022",
      "description": "InSight, Mars’ta güçlü bir deprem kaydetti. ARES-7’deki bağlantı ve yardımcı ekipman hasarı, bu kayıttan esinlenen varsayımsal oyun senaryosudur. NASA’nın gözlemlediği bir insan üssü hasarı değildir.",
      "source": "NASA — InSight’ın büyük Mars depremi kaydı",
      "sourceUrl": null
    }
  ]
} as const;
export const dailyCards = scenario.dailyCards as unknown as DailyCard[];
export const specialEvents = scenario.specialEvents as unknown as SpecialEvent[];
export const scienceFacts = scenario.scienceFacts as unknown as ScienceFact[];
