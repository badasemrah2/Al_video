import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerationOptions, GenerationJob } from '@/lib/types';
import { generateTextToVideo } from '@/lib/replicate-client';
import { checkRateLimit, rateLimitIdentify } from '@/lib/rate-limit';
import { generateJobId, saveJob, updateJob, publishProgress } from '@/lib/utils';
import { createJob as dbCreateJob, updateJobByExternalId as dbUpdateJob, appendEvent } from '@/lib/job-repo';
import { persistAndGetUrl } from '@/lib/storage';
import { notifyN8n } from '@/lib/n8n-client';

export async function POST(request: NextRequest) {
  try {
    const clientIP = rateLimitIdentify(request.ip);
    const rl = checkRateLimit(clientIP);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', retryAfter: rl.reset }, { status: 429 });
    }

    const options: VideoGenerationOptions = await request.json();

    // Validate input
    if (!options.prompt || options.prompt.length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (options.duration > 10 || options.duration < 2) {
      return NextResponse.json(
        { error: 'Duration must be between 2 and 10 seconds' },
        { status: 400 }
      );
    }

    // Build webhook URL for Replicate (development için kapalı)
    // const host = request.headers.get('host') || 'localhost:3000';
    // const protocol = request.headers.get('x-forwarded-proto') || 'http';
    // const replicateWebhookUrl = `${protocol}://${host}/api/webhooks/replicate`;
    const replicateWebhookUrl = null; // Development için webhook kapalı

    const job: GenerationJob = {
      id: generateJobId(),
      type: 'text-to-video',
      status: 'pending',
      progress: 0,
      prompt: options.prompt,
      createdAt: new Date(),
      webhookUrl: options.webhookUrl,
    };
    saveJob(job);
    // Persist to Supabase (fire and forget)
    dbCreateJob({
      externalId: job.id,
      type: job.type,
      prompt: job.prompt || '',
      negativePrompt: options.negativePrompt || undefined,
      durationSeconds: options.duration || undefined,
      aspectRatio: options.aspectRatio || undefined,
    })
      .then(() => appendEvent(job.id, 'pending', 0, { msg: 'created' }))
      .catch(e => console.warn('[db] createJob failed', e));
    publishProgress(job.id, { status: 'pending', progress: 0 });
        processVideoGeneration(job, options).catch(console.error);
    return NextResponse.json(job);
  } catch (error) {
    console.error('Text-to-video generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processVideoGeneration(job: GenerationJob, options: VideoGenerationOptions) {
  try {
    updateJob(job.id, { status: 'processing', progress: 5 });
    dbUpdateJob(job.id, { status: 'processing', progress: 5, startedAt: new Date().toISOString() })
      .then(() => appendEvent(job.id, 'processing', 5, { phase: 'start' }))
      .catch(e => console.warn('[db] update processing failed', e));
    publishProgress(job.id, { status: 'processing', progress: 5 });
  const num_frames = options.duration * options.fps;
  const env = (globalThis as any).process?.env || {};
  const isKling = (env.REPLICATE_T2V_MODEL || '').includes('kling');
  // Kling model input normalization to avoid 422 validation errors
  let klingDuration: number | undefined = options.duration;
  if (isKling) {
    // Allowed values per API: 5 or 10
    if (!klingDuration || (klingDuration !== 5 && klingDuration !== 10)) {
      klingDuration = klingDuration && klingDuration < 7 ? 5 : 10; // choose closest bucket
    }
  }
  // Normalize aspect ratio if provided as width/height or other form
  function normalizeAspectRatio(a?: string, w?: number, h?: number): string | undefined {
    if (!isKling) return undefined;
    const allowed = ['16:9','9:16','1:1'];
    if (a && allowed.includes(a)) return a;
    if (w && h) {
      const r = w > h ? '16:9' : w < h ? '9:16' : '1:1';
      return r;
    }
    return '16:9';
  }
  const klingAspect = normalizeAspectRatio(options.aspectRatio, options.width, options.height);
    // Stil prompt zenginleştirme
    const styleMap: Record<string, string> = {
      realistic: 'ultra realistic, high detail, natural colors',
      cinematic: 'cinematic, dramatic lighting, film grain, shallow depth of field',
      anime: 'anime style, vibrant colors, clean lines, cel shaded',
      cartoon: 'cartoon style, bold outlines, flat colors, playful',
    };
    const styleSuffix = styleMap[options.style] ? `, ${styleMap[options.style]}` : '';
    const styledPrompt = `${options.prompt}${styleSuffix}`;
    
    // Webhook only for production (requires HTTPS)
    const isProduction = false; // Disable webhook for localhost development
    
    const output = await generateTextToVideo(styledPrompt, isKling ? {
      negative_prompt: options.negativePrompt,
      duration: klingDuration,
      cfg_scale: options.cfgScale,
      aspect_ratio: klingAspect,
    } : {
      negative_prompt: options.negativePrompt,
      num_frames,
      width: options.width,
      height: options.height,
      fps: options.fps,
    });
    console.log('[text-route] Replicate output:', JSON.stringify(output, null, 2));
    console.log('[text-route] Replicate output type:', typeof output);
    console.log('[text-route] Replicate output direct:', output);
    
  updateJob(job.id, { progress: 70 });
  appendEvent(job.id, 'processing', 70, { phase: 'mid' }).catch(()=>{});
    publishProgress(job.id, { status: 'processing', progress: 70 });
    
    const resultUrl = await persistAndGetUrl(output, job.id);
    console.log('[text-route] Extracted URL:', resultUrl);
    
    updateJob(job.id, { status: 'completed', progress: 100, resultUrl, completedAt: new Date() });
    dbUpdateJob(job.id, { status: 'completed', progress: 100, resultUrl, completedAt: new Date().toISOString() })
      .then(() => appendEvent(job.id, 'completed', 100, { resultUrl }))
      .catch(e => console.warn('[db] complete update failed', e));
    console.log('[text-route] Job updated to completed with URL:', resultUrl);
    
    publishProgress(job.id, { status: 'completed', progress: 100, resultUrl });
    console.log('[text-route] Progress published');
    
    if (job.webhookUrl) {
      await notifyN8n(job.webhookUrl, { jobId: job.id, status: 'tamamlandı', progress: 100, resultUrl });
    }
  } catch (error) {
    const message = (error as Error)?.message || 'Unknown error';
    updateJob(job.id, { status: 'failed', progress: 100, error: message });
    dbUpdateJob(job.id, { status: 'failed', progress: 100, error: message, completedAt: new Date().toISOString() })
      .then(() => appendEvent(job.id, 'failed', 100, { error: message }))
      .catch(e => console.warn('[db] fail update failed', e));
    publishProgress(job.id, { status: 'failed', progress: 100, error: message });
    if (job.webhookUrl) {
      await notifyN8n(job.webhookUrl, { jobId: job.id, status: 'hata', progress: 100, error: message });
    }
    console.error('Video generation failed:', error);
  }
}