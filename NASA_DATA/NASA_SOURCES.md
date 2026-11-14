# SOL SURVIVOR — NASA Veri Kaynakları

## DONKI — Solar Flare (FLR)

- Kurum: NASA Community Coordinated Modeling Center (CCMC)
- Sistem: Database of Notifications, Knowledge, Information (DONKI)
- Olay türü: Solar Flare (FLR / Güneş Patlaması)
- Kullanılan endpoint: `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR`
- Erişim tarihi: 2026-11-14
- Çekilen zaman aralığı: Son 30 gün
- Ham FLR veri dosyası: `donki-flare-data.json`
- Tüm ham olay kayıtları: `donki-raw-events.json`
- React uyumlu normalleştirilmiş veri: `donki-events.json`
- Resmi kaynak: https://ccmc.gsfc.nasa.gov/tools/DONKI/

### DONKI olay kapsamı

`donki_fetch.py`, FLR, CME, SEP ve GST endpoint'lerini son 30 gün için sorgular.
GST'nin Kp indisleri Dünya manyetosferine ilişkindir; Mars koşulu veya Mars
habitatı riski olarak yorumlanmaz. Boş SEP dizisi, sorgu aralığında DONKI SEP
kaydının bulunmadığını gösterir; sıfır radyasyon olduğu anlamına gelmez.

## Bilimsel kapsam notu

DONKI, uzay hava olaylarını kaydeder. FLR verisindeki `classType` alanı,
GOES tarafından gözlenen güneş patlaması sınıfıdır; doğrudan Mars yüzeyi
radyasyon dozu veya oyundaki tehlike seviyesi değildir.

Oyundaki kaynak etkileri ve sayısal değerler, NASA gözlem verisinden ayrı
olarak "oyun varsayımı" şeklinde belgelenecektir.

## Curiosity — Radiation Assessment Detector (RAD)

- Kurum: NASA / Mars Science Laboratory (Curiosity)
- Araç: Radiation Assessment Detector (RAD)
- Ölçüm konumu: Gale Krateri, Mars; Curiosity rover deck
- Hazırlanan veri dosyası: `radiation-data.json`
- Resmi araç açıklaması: https://science.nasa.gov/mission/msl-curiosity/science-instruments/
- NASA yüzey gözlemleri özeti: https://science.nasa.gov/resource/radiation-measurements-on-mars/
- Birincil yayın: Hassler et al. (2014), DOI: https://doi.org/10.1126/science.1244797

### RAD veri sınırı

`radiation-data.json` içindeki 0.210 ± 0.040 mGy/gün ve 0.64 ± 0.12 mSv/gün
değerleri, Curiosity'nin Gale Krateri'ndeki ilk yaklaşık 300 solunda gözlenen
GCR kaynaklı ortalamalardır. Bu değerler Mars'ın tümü, tüm mevsimler veya bir
habitatın içi için sabit bir doz değeri değildir.

## Perseverance — MOXIE

- Araç: Mars Oxygen In-Situ Resource Utilization Experiment (MOXIE)
- Konum: Jezero Krateri, Mars
- Hazırlanan veri dosyası: `mars-environment.json`
- Resmi sonuç: https://www.nasa.gov/solar-system/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/
- 2021-2023 döneminde 16 çalıştırmada toplam 122 g oksijen üretti; en yüksek
  üretim hızı 12 g/saat ve saflık en az %98 olarak açıklandı.

## Perseverance — MEDA

- Araç: Mars Environmental Dynamics Analyzer (MEDA)
- Konum: Jezero Krateri, Mars
- Resmi araç açıklaması: https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/
- MEDA; rüzgâr, sıcaklık, nem ve atmosferik toz özelliklerini ölçer. Bu proje
  için MEDA bölümü ölçülebilir çevresel değişkenleri tanımlar; canlı ölçüm seti değildir.

## ISS — ECLSS su geri-kazanımı

- Sistem: Environmental Control and Life Support System (ECLSS)
- Konum: International Space Station (ISS), alçak Dünya yörüngesi
- Resmi kilometre taşı: https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/
- 2023'te ISS ECLSS, toplam suyun %98'ini geri kazanma hedefini gösterdi.
- Bu, Mars'ta ölçülmüş bir su geri-kazanım oranı değil; Mars habitatı için
  yaşam-destek teknolojisi analoğudur.
