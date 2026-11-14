import requests
import json
from datetime import date, datetime, timedelta, timezone
from requests.exceptions import RequestException

# DONKI, Eylül 2026'da CCMC'nin güncel altyapısına taşındı.
BASE_URL = "https://ccmc.gsfc.nasa.gov/DONKI-API/get"
EVENT_TYPES = ("FLR", "CME", "SEP", "GST")


def event_id(event_type, record):
    """Her DONKI olay türünün kendi benzersiz kimlik alanı vardır."""
    id_fields = {
        "FLR": "flrID",
        "CME": "activityID",
        "SEP": "sepID",
        "GST": "gstID",
    }
    return record.get(id_fields[event_type])


def normalize_event(event_type, record):
    """DONKI kayıtlarını React için tutarlı, fakat gözlemsel bir şemaya dönüştürür."""
    linked_events = record.get("linkedEvents") or []
    instruments = [
        instrument.get("displayName")
        for instrument in record.get("instruments", [])
    ]

    observed = {
        "startTime": record.get("startTime") or record.get("beginTime") or record.get("eventTime"),
        "peakTime": record.get("peakTime"),
        "endTime": record.get("endTime"),
        "sourceLocation": record.get("sourceLocation"),
        "activeRegionNumber": record.get("activeRegionNum"),
        "instruments": instruments,
    }

    event_specific = {}
    if event_type == "FLR":
        event_specific["flareClass"] = record.get("classType")
    elif event_type == "CME":
        event_specific["analyses"] = record.get("cmeAnalyses") or []
    elif event_type == "GST":
        event_specific["earthKpIndices"] = record.get("allKpIndex") or []

    return {
        "id": event_id(event_type, record),
        "eventType": event_type,
        "observed": observed,
        "eventSpecific": event_specific,
        "linkedEventIds": [event.get("activityID") for event in linked_events],
        "source": {
            "catalog": record.get("catalog"),
            "detailsUrl": record.get("link"),
            "submissionTime": record.get("submissionTime"),
            "versionId": record.get("versionId"),
        },
    }


# Son 30 günlük tarih aralığı
end_date = date.today()
start_date = end_date - timedelta(days=30)
params = {"startDate": str(start_date), "endDate": str(end_date)}

try:
    raw_by_type = {}
    for event_type in EVENT_TYPES:
        response = requests.get(f"{BASE_URL}/{event_type}", params=params, timeout=30)
        response.raise_for_status()
        raw_by_type[event_type] = response.json()

    # Geri izlenebilirlik: API yanıtları her olay türüyle birlikte saklanır.
    with open("donki-raw-events.json", "w", encoding="utf-8") as file:
        json.dump(raw_by_type, file, indent=2, ensure_ascii=False)

    # Önceki FLR ham veri dosyasını kullanan çalışmalarla geriye uyumluluk.
    with open("donki-flare-data.json", "w", encoding="utf-8") as file:
        json.dump(raw_by_type["FLR"], file, indent=2, ensure_ascii=False)

    normalized_events = [
        normalize_event(event_type, record)
        for event_type in EVENT_TYPES
        for record in raw_by_type[event_type]
    ]
    event_counts = {event_type: len(raw_by_type[event_type]) for event_type in EVENT_TYPES}

    export = {
        "metadata": {
            "schemaVersion": "1.1",
            "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
            "dataSource": "NASA CCMC DONKI",
            "endpoints": {event_type: f"{BASE_URL}/{event_type}" for event_type in EVENT_TYPES},
            "query": params,
            "eventCounts": event_counts,
            "scientificScope": (
                "DONKI, uzay hava olaylarını kaydeder. Kayıtlar Mars yüzeyindeki "
                "radyasyon dozu veya habitat içi koşulların doğrudan ölçümü değildir."
            ),
            "eventTypeNotes": {
                "FLR": "Güneş patlaması sınıfı, GOES X-ışını gözlemidir.",
                "CME": "Koronal kütle atımı; yön, hız ve varış etkileri olay analizine bağlıdır.",
                "SEP": "Güneş enerjik parçacık olayı; boş dizi, sorgu aralığında kayıt olmadığı anlamına gelir.",
                "GST": "Jeomanyetik fırtına ve Kp indisleri Dünya manyetosferine ilişkindir; Mars için doğrudan kullanılmaz."
            },
            "gameModelNote": "Bu dosya oyun kaynak etkileri veya sayısal risk puanı içermez.",
        },
        "events": normalized_events,
    }

    with open("donki-events.json", "w", encoding="utf-8") as file:
        json.dump(export, file, indent=2, ensure_ascii=False)

    print("NASA DONKI bağlantısı başarılı!")
    print("Olay sayıları:", event_counts)
    print("Ham veri donki-raw-events.json dosyasına kaydedildi.")
    print("React uyumlu veri donki-events.json dosyasına kaydedildi.")

except RequestException as error:
    print("NASA DONKI bağlantısı şu anda tamamlanamadı.")
    print("Bu geçici bir ağ veya NASA sunucusu zaman aşımı olabilir.")
    print("Hata:", error)
    print("Mevcut JSON dosyaları korunmuştur.")
