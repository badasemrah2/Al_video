# AI Video Studio — Technical Guide (n8n + Replicate, Next.js 14)

> Luma notu: Bu dosya **README (kullanıcı odaklı)** ile **Developer Guide (geliştirici odaklı)** içerikleri birleştirir. VS Code/Copilot veya StackBlitz ile doğrudan proje iskeletini çıkarabilmen için tam akış sunar. Gerektiğinde “sistem üstü” ölçeklenebilirlik önerileri eklenmiştir.

---

## 1) Proje Özeti
- **Amaç:** Next.js 14 tabanlı, Replicate API ile **text-to-video** ve **image-to-video** üretimi yapan, **n8n entegrasyonlu** modern bir web uygulaması.
- **Hedefler:**
  - Metinden/video üretim ve görselden-video animasyon.
  - İlerleme takibi (SSE/WebSocket).
  - n8n ile tetikleme & callback bildirimleri.
  - Üretim geçmişi, oynatıcı ve indirme.
- **Kullanım Senaryosu:** Tek kişilik showcase’ten çok kullanıcılı SaaS’a kadar.

---

## 2) Mimarinin Kuşbakışı

```
[UI/Next.js 14]
  ├─ Tabs: TextToVideo | ImageToVideo | History | Settings
  ├─ API Routes (App Router)
  │   ├─ POST /api/generate-video/text
  │   ├─ POST /api/generate-video/image
  │   ├─ GET  /api/generate-video/status/[jobId]
  │   ├─ GET  /api/generate-video/download/[jobId]
  │   └─ POST /api/n8n/webhook   (callback & events)
  ├─ Realtime: SSE endpoint (/api/progress/[jobId])
  └─ Storage/CDN: Supabase Storage veya Cloudflare R2 (önerilir)

[Replicate API]
  └─ Stable Video Diffusion / img2vid modelleri

[n8n]
  ├─ HTTP Request: üretimi tetikle
  ├─ Webhook: durumu/sonucu al
  └─ Dağıtım: YouTube/LinkedIn/TG/Email entegrasyonları

[Queue/Jobs] (Opsiyonel fakat önerilir)
  ├─ Redis/Upstash veya DB tabanlı Job Table
  └─ Rate Limit + Retry + Idempotency
```

**Sistem Üstü Öneriler**
- **Queue:** Artan istekleri sıraya almak için Redis/Upstash ya da DB tabanlı basit bir job tablosu kullan (ölçek ve maliyet dengesine göre).
- **Güvenlik:** Webhook’ta HMAC imza doğrulama + `x-api-key`.
- **Asset Yönetimi:** Üretilen videoları Storage+CDN’e yaz, paylaşılabilir imzalı URL üret.
- **Gözlemlenebilirlik:** Request ID, jobId, structured logging (pino), basit metrics endpoint.
- **Idempotency:** Aynı executionId ile tekrar gelen talepleri tek job’a bağla.

---

## 3) Teknoloji Yığını
- **Next.js 14 (App Router), React 18, TypeScript**
- **Tailwind CSS, shadcn/ui, Radix UI, Framer Motion**
- **State:** React Query + (opsiyonel) Zustand
- **Forms:** React Hook Form + Zod
- **Backend:** Next API Routes; Replicate SDK
- **Automation:** n8n (HTTP Request/Webhook/Dağıtım)
- **Storage/CDN:** Supabase Storage veya Cloudflare R2
- **Queue (Opsiyonel):** Upstash Redis veya DB tabanlı job tablosu

---

## 4) Kurulum & Komutlar

```bash
# 1) Proje iskeleti
npx create-next-app@latest ai-video-studio --ts --eslint --src-dir --app --tailwind
cd ai-video-studio

# 2) UI & Dev paketleri
npm i @radix-ui/react-tabs @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slider @radix-ui/react-switch \
  framer-motion lucide-react react-dropzone @tanstack/react-query @hookform/resolvers react-hook-form zod clsx tailwind-merge next-themes sonner zustand axios replicate

# 3) Dev deps
npm i -D tailwindcss-animate

# 4) Çalıştır
npm run dev
```

**.env.local (örnek)**
```
# Replicate API
REPLICATE_API_TOKEN=your_replicate_token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="AI Video Studio"

# Limits & Flags
RATE_LIMIT_PER_DAY=10
RATE_LIMIT_PER_HOUR=5
MAX_VIDEO_DURATION=10
MIN_VIDEO_DURATION=2
MAX_FILE_SIZE_MB=10
DEFAULT_FPS=30

# n8n (opsiyonel)
N8N_BASE_URL=https://your-n8n-instance.com
N8N_WEBHOOK_SECRET=your_webhook_secret_here
ENABLE_N8N_INTEGRATION=true
ENABLE_HISTORY=true
ENABLE_DARK_MODE=true
```

---

## 5) Proje Yapısı (önerilen)
```
/src
  /app
    layout.tsx            # ThemeProvider, Toaster, QueryClientProvider
    page.tsx              # Tab-based ana sayfa
    /api
      /generate-video
        /text/route.ts    # text→video
        /image/route.ts   # image→video
        /status/[jobId]/route.ts
      /n8n
        /webhook/route.ts # callback
      /progress/[jobId]/route.ts # SSE (opsiyonel)
  /components
    TextToVideo.tsx
    ImageToVideo.tsx
    VideoPlayer.tsx
    ProgressBar.tsx
    WebhookConfig.tsx
    GenerationHistory.tsx
    ThemeToggle.tsx
  /lib
    replicate-client.ts
    n8n-client.ts
    rate-limit.ts
    storage.ts
    signatures.ts
    utils.ts
  /hooks
    useVideoGeneration.ts
    useWebhook.ts
    useLocalStorage.ts
  /types
    index.ts
```

---

## 6) UI/UX Gereksinimleri (Özet)
- **TextToVideo**: prompt (10–500), negative prompt, preset template’ler, süre (2–10s), FPS (24/30/60), çözünürlük (512/768/1024), stil (realistic/anime/cartoon/cinematic), opsiyonel webhook URL, canlı ilerleme.
- **ImageToVideo**: drag&drop, max 10MB jpg/png/webp, preview+crop, motion intensity (Low/Med/High), camera movement (Static/ZoomIn/ZoomOut/Pan), motion prompt, before/after, opsiyonel webhook URL.
- **WebhookConfig**: URL input, test connection, executionId (ops), callback seçenekleri (start/progress/complete/error), payload preview, kopyala.
- **VideoPlayer**: HTML5/Video.js, play/pause/seek, volume, fullscreen, 0.5x–2x speed, frame-by-frame, download (custom filename), share URL.
- **Tema**: Dark/Light toggle, glassmorphism (gradient arkaplan, blur, micro-interactions).

---

## 7) Replicate Entegrasyonu (lib/replicate-client.ts)
```ts
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function generateTextToVideo(
  prompt: string,
  options: { negative_prompt?: string; num_frames: number; num_inference_steps: number; width: number; height: number }
) {
  return await replicate.run(
    'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    { input: { prompt, ...options } }
  )
}

export async function generateImageToVideo(
  image: string,
  options: { motion_bucket_id: number; fps: number; num_frames: number }
) {
  return await replicate.run(
    'stability-ai/stable-video-diffusion-img2vid:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    { input: { image, ...options } }
  )
}
```

**Not:** Model/versiyon pin’lerini sürüm yükseltmelerinde güncelle.

---

## 8) API Routes — Örnekler

### 8.1) POST /api/generate-video/text
```ts
import { NextRequest, NextResponse } from 'next/server'
import { generateTextToVideo } from '@/lib/replicate-client'
import { rateLimit } from '@/lib/rate-limit'
import { publishProgress } from '@/lib/utils'

export async function POST(req: NextRequest) {
  await rateLimit(req)
  const body = await req.json()
  const { prompt, negativePrompt, duration = 4, fps = 30, width = 768, height = 768, webhookUrl, executionId } = body

  const num_frames = Math.floor(duration * fps)
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2,8)}`

  // İlk progress yayını
  publishProgress(jobId, { status: 'başlatıldı', progress: 1 })

  try {
    const output = await generateTextToVideo(prompt, {
      negative_prompt: negativePrompt,
      num_frames,
      num_inference_steps: 25,
      width,
      height,
    })

    // output → URL veya buffer benzeri dönüş (Replicate modeline göre değişir)
    const resultUrl = await persistAndGetUrl(output, jobId) // storage.ts içindeki helper

    // Final progress
    publishProgress(jobId, { status: 'tamamlandı', progress: 100, resultUrl })

    // Opsiyonel webhook bildirimi
    if (webhookUrl) await notifyN8n(webhookUrl, { jobId, status: 'tamamlandı', progress: 100, resultUrl, executionId })

    return NextResponse.json({ jobId, resultUrl })
  } catch (err: any) {
    publishProgress(jobId, { status: 'hata', progress: 100, error: err?.message })
    if (webhookUrl) await notifyN8n(webhookUrl, { jobId, status: 'hata', progress: 100, error: err?.message, executionId })
    return NextResponse.json({ jobId, error: 'Generation failed' }, { status: 500 })
  }
}
```

### 8.2) POST /api/generate-video/image
```ts
// image (base64 veya URL) + motion ayarları ile benzer akış
```

### 8.3) GET /api/generate-video/status/[jobId]
```ts
// storage/db’den job durumunu döndür veya memory cache (demo)
```

### 8.4) GET /api/generate-video/download/[jobId]
```ts
// Storage’daki dosyayı imzalı URL ile döndür
```

### 8.5) POST /api/n8n/webhook — Güvenlikli Callback
```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyHmacSignature } from '@/lib/signatures'

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('x-n8n-signature') || ''
  if (!verifyHmacSignature(raw, signature, process.env.N8N_WEBHOOK_SECRET!)) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  const payload = JSON.parse(raw)
  // payload: { jobId, status, progress, resultUrl, executionId, ... }
  // burada UI’ye progress publish et / job kaydını güncelle / routing yap

  return NextResponse.json({ ok: true })
}
```

### 8.6) GET /api/progress/[jobId] — SSE
```ts
// Sunucu-Taraflı Etkinlikler ile tarayıcıya gerçek zamanlı progress gönder
```

---

## 9) Yardımcı Kütüphaneler (lib)

### 9.1) rate-limit.ts (Basit)
```ts
export async function rateLimit(req: Request) {
  // IP bazlı basit oran kısıtlama (Upstash Redis varsa oraya taşı)
}
```

### 9.2) storage.ts
```ts
export async function persistAndGetUrl(output: any, jobId: string) {
  // Replicate çıktısını Storage’a yaz ve public/İmzalı URL döndür
  return `https://cdn.example.com/videos/${jobId}.mp4`
}
```

### 9.3) signatures.ts
```ts
import crypto from 'crypto'

export function verifyHmacSignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return signature === digest
}
```

### 9.4) n8n-client.ts — Bildirim
```ts
export async function notifyN8n(webhookUrl: string, payload: Record<string, any>) {
  await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  }) })
}
```

---

## 10) UI Bileşenleri — Kısa Notlar
- **TextToVideo**: Template dropdown + advanced ayarlar; validasyon (Zod).
- **ImageToVideo**: Crop & motion kontrolleri; before/after toggle.
- **GenerationHistory**: localStorage + (opsiyonel) DB sync → cihazlar arası tarihçe.
- **WebhookConfig**: Test connection düğmesi; payload preview modal.
- **ProgressBar**: SSE aboneliği ile canlı ilerleme.
- **VideoPlayer**: Download (custom filename), share link kopyalama.

---

## 11) n8n Workflow Önerisi
**Basit Akış**
1. **HTTP Request**: `/api/generate-video/text` çağır.
2. **Wait**: 10–15 sn (yüksek QPS’te faydalı)
3. **Webhook**: `/api/n8n/webhook` (status/progress/complete/error)
4. **Switch**: duruma göre dallan.
5. **Dağıtım**: YouTube/LinkedIn/Telegram/Email.

**Güvenlik**
- n8n → Next.js dönüşünde body’ye HMAC imza ekle; Next.js tarafında doğrula.
- `x-api-key` sabitlemesi ile ikinci katman.

---

## 12) Test Senaryoları (özet)
- **Text-to-Video**: 10–500 karakter kuralı; stil/çözünürlük varyasyonları; webhook tetik.
- **Image-to-Video**: 10MB sınırı, format reddi; motion/camera kombinasyonları.
- **Webhook**: URL validasyonu, connection test, start/progress/complete/error; retry.
- **UI/UX**: Dark/Light geçiş; responsive; loading/boş durumlar; toast’lar.
- **Performans**: Büyük dosya yükleme; multi-tab bellek; rate-limiting doğrulaması.

---

## 13) Deployment
- **Vercel (önerilen)**: `npm run build` → Vercel Prod.
- **Docker**: `docker build -t ai-video-studio . && docker run -p 3000:3000 ai-video-studio`.
- **Env Kontrol Listesi**
  - REPLICATE_API_TOKEN tanımlı.
  - (Opsiyonel) N8N_* değerleri doğru.
  - LIMIT değerleri işletim koşullarına uygun.

---

## 14) Yol Haritası (Opsiyonel Geliştirmeler)
- **Queue katmanı**: Upstash Redis veya DB Job Table, gecikmeli işler, retry, dead-letter.
- **Gerçek zaman**: SSE → WebSocket’e yükseltme + oda bazlı (jobId) yayın.
- **Çoklu model**: OpenAI/Suno alternatifi; model seçici UI.
- **Çok-kiracılılık**: Team/Workspace, API key per tenant, kota.
- **Faturalama**: Stripe (kredi/jeton), kotalar, kullanım raporları.
- **İçerik güvenliği**: Prompt filtreleme, content policy, telif şikayet akışı.

---

## 15) Hızlı Başlangıç (Copilot / Bolt)
- **Copilot Başlangıç Komutu**
  - `@workspace /new Create a Next.js 14 AI video generator app with TypeScript, Tailwind CSS, n8n webhook integration, text-to-video and image-to-video features using Replicate API`
- **Bolt Tek Prompt**: Proje yapısı + bileşenleri + env + README’yi beraber oluşturacak şekilde yukarıdaki mimariyi özetleyen uzun promptu kullan.

---

## 16) Lisans & Katkı
- MIT lisansı.
- PR’lar feature branch üzerinden.

---

**Not:** Bu rehber, üretim öncesi güvenlik/ölçeklenebilirlik için ek öneriler içerir. Gerektiğinde minimal MVP’ye indirip sonra büyütebilirsin. Rota sağlam, dümen sende kaptan. ⚓️🚀

