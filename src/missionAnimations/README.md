# Sol Survivor — özgün 28 animasyonun oyun entegrasyonu

Kurulum (proje kökünde, bir kez):

```bash
npm install three@0.170.0 @react-three/fiber@^9.0.0 @types/three@0.170.0
npm run dev
```

Ana ekran özgün Mars görselini korur. Kart seçeneği onaylanınca ilgili özgün 3D animasyon sırası tam ekran açılır. Bitiş veya atlama sonrası karar sonucu gösterilir. Oyuncu Devam Et ile ilerler.

missionBridge.ts, 60 kart seçeneğini, gecikmeli sonuçları ve özel olay müdahalelerini paketin kendi JSON eşlemelerinden çözümler. Kaynak değişikliklerini yalnızca mevcut oyun motoru uygular. Oyuncu atlama yaptığında kaynak maliyeti tekrar uygulanmaz.

Sahne durumu kartlar arasında korunur. Menüden dönüldüğünde veya yenilendiğinde motorun kayıtlı karar geçmişinden yeniden kurulur. Three.js sahneleri ve animasyon kodları yüklenen özgün paketten alınmıştır; teknik değişiklikler projenin TypeScript ayarlarıyla uyumluluk içindir.
