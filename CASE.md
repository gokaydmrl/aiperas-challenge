# Frontend Developer Case – Streaming Chat UI (Resumable)

## 🎯 Amaç

Bu case’in amacı, **streaming (parça parça) veri dönen bir API** ile çalışan,
**yeniden bağlanabilir (resumable) bir AI sohbet arayüzü** geliştirmenizi beklemektir.

Bu çalışma; UI tasarımından ziyade **state yönetimi, streaming mantığı, persistence ve edge‑case** senaryoları içindir.

---

## 🧠 Senaryo

Size aşağıdaki davranışlara sahip bir backend servis sağlanacaktır:

- Kullanıcı mesaj gönderir
- Backend:
  - Tek bir uzun cevabı
  - **20 saniye boyunca**
  - **her saniye bir parça (chunk)** olacak şekilde
  - **Server‑Sent Events (SSE)** ile döner

Bu davranış, modern AI sohbet uygulamalarındaki “yazıyormuş gibi akan cevap” deneyimini simüle eder.

---

## 🔁 Kritik Gereksinim (ÖNEMLİ)

Frontend uygulama:

- Kapatılıp tekrar açıldığında (refresh, tab close, vs):
  - **Stream kaldığı yerden devam edebilmelidir**
  - Daha önce gelen **tüm chunk’lar ekranda görünmelidir**
  - Kullanıcı cevap yarım kaldıysa, tekrar bağlandığında **devam eden stream’i izleyebilmelidir**


---

## 🔌 Backend API Bilgisi

### Endpoint

```
POST /chat
```

### Request Body

```json
{
  "message": "Merhaba"
}
```

### Response

- `Content-Type: text/event-stream`
- Her saniye **bir chunk**
- Toplam süre: **20 saniye**
- Her chunk sıralı bir `index` içerir

Örnek chunk:

```json
{
  "chunk": "Lorem ipsum dolor sit amet...",
  "index": 5
}
```

Stream sonu:

```json
{
  "done": true,
  "message": "Stream tamamlandı."
}
```

---

## 🖥️ Beklenen Arayüz

Minimum beklentiler:

- Mesaj gönderilebilen bir input alanı
- Kullanıcı mesajının ekranda gösterilmesi
- AI cevabının:
  - **parça parça**
  - **geldikçe append edilmesi**
- Stream devam ederken uygun UI state’i
- Stream bittiğinde input’un tekrar aktif olması

---

## 🧩 Serbestsiniz

Framework olarak NextJS beklenmektedir. Haricinde kalan tüm konular için serbestsiniz
- State management yaklaşımı
- UI kütüphanesi veya custom CSS
- Dosya ve proje yapısı

> Görsel şıklık değil, **davranış doğruluğu** beklenmektedir.

---

## 📦 Teslim

- Çalışır bir frontend uygulaması
- README veya kısa açıklama
- (Varsa) deploy linki
- Kurulum / çalıştırma adımları
