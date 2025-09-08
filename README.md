# AI Video Studio

🎬 Next.js tabanlı AI video üretim platformu. Replicate API ve Supabase entegrasyonu ile güçlendirilmiş.

## ✨ Özellikler

### Ana Özellikler
- **Text-to-Video**: Metin promptlarından video üretimi
- **Image-to-Video**: Görselleri hareketli videolara dönüştürme  
- **Real-time İzleme**: Database polling ile canlı durum güncellemeleri
- **Video İndirme**: Üretilen videoları direkt indirme
- **Persistent History**: Tüm videolar Supabase'de kalıcı olarak saklanır
- **Video Oynatıcı**: Tam özellikli video oynatıcı ve indirme
- **Üretim Geçmişi**: Tüm videolarınızı takip edin

### n8n Entegrasyonu
- **Webhook Desteği**: n8n workflow'larınızla otomatik entegrasyon
- **Durum Bildirimleri**: Video üretim durumunu n8n'e otomatik bildir
- **API Endpoints**: n8n'den video üretimi tetikleme

### Teknik Özellikler
- **Modern UI**: Glassmorphism tasarım ve smooth animasyonlar
- **Responsive**: Tüm cihazlarda mükemmel görünüm
- **Dark/Light Mode**: Tema desteği
- **TypeScript**: Tam tip güvenliği
- **Form Validation**: Gelişmiş form doğrulama

## 🛠️ Teknoloji Stack'i

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: Shadcn/ui, Radix UI
- **State Management**: React Query, Zustand
- **Form Handling**: React Hook Form, Zod
- **API Integration**: Replicate API, n8n Webhooks

## 📦 Kurulum

```bash
# Projeyi klonlayın
git clone <repo-url>
cd ai-video-studio

# Bağımlılıkları yükleyin
npm install

# Environment variables'ları ayarlayın
cp .env.example .env.local

# Geliştirme sunucusunu başlatın
npm run dev
```

## 🔧 Environment Variables

```env
# Replicate API
REPLICATE_API_TOKEN=your_replicate_token

# App (Public)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="AI Video Studio"

# Limits & Defaults
RATE_LIMIT_PER_DAY=10
RATE_LIMIT_PER_HOUR=5
MAX_VIDEO_DURATION=10
MIN_VIDEO_DURATION=2
MAX_FILE_SIZE_MB=10
DEFAULT_FPS=30

# n8n Integration (Optional)
N8N_BASE_URL=https://your-n8n-instance.com
N8N_WEBHOOK_SECRET=your_webhook_secret_here   # HMAC doğrulama için
ENABLE_N8N_INTEGRATION=true
ENABLE_HISTORY=true
ENABLE_DARK_MODE=true
```

## 🔗 n8n Entegrasyonu

### Webhook URL Formatı

```text
https://your-n8n-instance.com/webhook/video-generation
```

### n8n'den Video Üretimi Tetikleme

```json
{
  "action": "video_generation_request",
  "type": "text-to-video",
  "prompt": "Güzel bir doğa manzarası",
  "duration": 4,
  "fps": 30,
  "style": "realistic",
  "callbackUrl": "https://your-n8n-instance.com/webhook/video-callback",
  "executionId": "exec_123456"
}
```

### Webhook Payload (n8n'e Gönderilen)

```json
{
  "jobId": "job_1234567890_abc123",
  "status": "tamamlandı",
  "progress": 100,
  "resultUrl": "https://example.com/videos/job_123.mp4",
  "executionId": "exec_123456"
}
```

### n8n Workflow Örneği

1. **HTTP Request Node**: Video üretimi tetikle
2. **Webhook Node**: Durum güncellemelerini al
3. **Switch Node**: Duruma göre aksiyon al
4. **Function Node**: Sonuçları işle

## 🎯 Kullanım

### Metinden Video

1. "Metinden Video" sekmesini seçin
2. Video açıklamanızı yazın
3. Stil ve ayarları seçin
4. n8n webhook URL'i ekleyin (opsiyonel)
5. "Video Üret" butonuna tıklayın

### Görseldan Video

1. "Görseldan Video" sekmesini seçin
2. Görselinizi yükleyin
3. Animasyon ayarlarını yapın
4. n8n webhook URL'i ekleyin (opsiyonel)
5. "Görseli Canlandır" butonuna tıklayın

## 📱 Responsive Tasarım

- **Mobile First**: Mobil cihazlar için optimize edilmiş
- **Tablet Uyumlu**: Tablet görünümü için özel düzenlemeler
- **Desktop**: Geniş ekranlar için gelişmiş layout

## 🎨 Tasarım Özellikleri

- **Gradient Backgrounds**: Mor-mavi gradient geçişleri
- **Glassmorphism**: Modern cam efekti tasarım
- **Smooth Animations**: Framer Motion ile akıcı animasyonlar
- **Micro Interactions**: Kullanıcı etkileşimleri için küçük animasyonlar

## 🔒 Güvenlik

- **Rate Limiting**: Günlük kullanım limitleri
- **File Validation**: Dosya tipi ve boyut kontrolü
- **Input Sanitization**: Güvenli veri işleme
- **CORS Protection**: Cross-origin istekleri koruması

## 📊 API Endpoints

### Video Üretimi

- `POST /api/generate-video/text` - Metinden video
- `POST /api/generate-video/image` - Görseldan video
- `GET /api/generate-video/status/[jobId]` - Durum sorgulama
- `GET /api/generate-video/download/[jobId]` - Video indirme
- `GET /api/progress/[jobId]` - SSE ile gerçek zamanlı ilerleme (EventSource)

### n8n Entegrasyonu (API)

- `POST /api/n8n/webhook` - n8n webhook endpoint

#### Güvenlik

Webhook isteklerine HMAC imza ekleyin:

```text
x-n8n-signature: <hex hmac sha256 rawBody>
```

Sunucu tarafında `N8N_WEBHOOK_SECRET` ile doğrulanır. Geçersiz ise 401 döner.

#### Örnek İstek (Text To Video)

```json
{
  "action": "video_generation_request",
  "type": "text-to-video",
  "prompt": "Güzel bir doğa manzarası",
  "duration": 4,
  "fps": 30,
  "style": "cinematic",
  "callbackUrl": "https://your-n8n-instance.com/webhook/video-callback",
  "executionId": "exec_123456"
}
```

Stil seçimi backend'de prompt'a otomatik zenginleştirme (realistic/anime/cartoon/cinematic descriptor) olarak eklenir.

## 🚀 Deployment

## 🗄️ Kalıcı Job Saklama (Supabase)

Üretim geçmişini kalıcı tutmak için Supabase şeması eklendi. SQL dosyası: `supabase_schema.sql`.

### Adımlar
1. Supabase SQL Editor aç → dosyadaki komutları çalıştır.
2. `.env.local` içine:
```
NEXT_PUBLIC_SUPABASE_URL=...  
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
3. Client import: `import { supabase } from '@/lib/supabase';`
4. CRUD yardımcıları: `lib/job-repo.ts`

### Örnek Kullanım
```ts
import { createJob, updateJobByExternalId, appendEvent } from '@/lib/job-repo';

const job = await createJob({
  externalId: 'job_123',
  type: 'text-to-video',
  prompt: 'Sunset over Bosphorus',
  durationSeconds: 5,
  aspectRatio: '1:1'
});

await updateJobByExternalId('job_123', { status: 'processing', progress: 30 });
await appendEvent('job_123', 'processing', 30, { note: 'frame batch 1' });
```

### Tablo Yapısı (Özet)
`jobs`: kalıcı job meta (status, progress, result_url ...)

`job_events`: zaman çizelgesi (status değişimleri, log payload)

### İleride
- RLS + kullanıcı kimliği (`user_id`) bağlama  
- SSE için `job_events` NOTIFY trigger  
- Günlük maliyet raporu (materialized view)  


### Vercel (Önerilen)

```bash
npm run build
vercel --prod
```

### Docker

```bash
docker build -t ai-video-studio .
docker run -p 3000:3000 ai-video-studio
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🆘 Destek

Herhangi bir sorun yaşarsanız:
- GitHub Issues açın
- Dokümantasyonu kontrol edin
- Community forumlarını ziyaret edin

---

**AI Video Stüdyosu** - Yapay zeka ile video üretiminin geleceği 🎬✨

---

## 📌 Yol Haritası / Backlog

- Queue & Retry (Redis / Upstash)
- WebSocket upgrade (SSE yerine job odaları)
- Çoklu model seçimi (farklı Replicate / diğer sağlayıcılar)
- Kullanım kotası & Stripe faturalama
- Prompt filtreleme & içerik politika katmanı
- Çok kiracılı workspace mimarisi
- Video depolama için R2 / Supabase Storage entegrasyonu (şu an memory placeholder)
