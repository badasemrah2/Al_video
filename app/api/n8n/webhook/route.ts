import { NextRequest, NextResponse } from 'next/server';
import { verifyHmacSignature } from '@/lib/signatures';
import { generateJobId, saveJob, updateJob, publishProgress } from '@/lib/utils';
import { notifyN8n } from '@/lib/n8n-client';
import { generateTextToVideo } from '@/lib/replicate-client';
import { persistAndGetUrl } from '@/lib/storage';
import type { GenerationJob } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const signature = request.headers.get('x-n8n-signature') || '';
  const secret = (globalThis as any).process?.env?.N8N_WEBHOOK_SECRET as string | undefined;
    if (secret) {
      const valid = verifyHmacSignature(raw, signature, secret);
      if (!valid) {
        return new NextResponse('Invalid signature', { status: 401 });
      }
    }
    const payload = JSON.parse(raw);
    if (payload.action === 'video_generation_request') {
      const job = await handleRequest(payload);
      return NextResponse.json({ ok: true, job });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('n8n webhook error', e);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function handleRequest(payload: any) {
  const job: GenerationJob = {
    id: generateJobId(),
    type: 'text-to-video',
    status: 'pending',
    progress: 0,
    prompt: payload.prompt,
    createdAt: new Date(),
    webhookUrl: payload.callbackUrl,
    n8nExecutionId: payload.executionId,
  };
  saveJob(job);
  publishProgress(job.id, { status: 'pending', progress: 0 });
  processJob(job, payload).catch(console.error);
  return job;
}

async function processJob(job: GenerationJob, payload: any) {
  try {
    updateJob(job.id, { status: 'processing', progress: 5 });
    publishProgress(job.id, { status: 'processing', progress: 5 });
    const num_frames = (payload.duration || 4) * (payload.fps || 30);
    const output = await generateTextToVideo(payload.prompt, {
      num_frames,
      width: payload.width || 768,
      height: payload.height || 768,
      negative_prompt: payload.negativePrompt,
      fps: payload.fps || 30,
    });
    updateJob(job.id, { progress: 70 });
    publishProgress(job.id, { status: 'processing', progress: 70 });
    const resultUrl = await persistAndGetUrl(output, job.id);
    updateJob(job.id, { status: 'completed', progress: 100, resultUrl, completedAt: new Date() });
    publishProgress(job.id, { status: 'completed', progress: 100, resultUrl });
    if (job.webhookUrl) await notifyN8n(job.webhookUrl, { jobId: job.id, status: 'tamamlandı', progress: 100, resultUrl });
  } catch (e) {
    const message = (e as Error)?.message || 'Unknown error';
    updateJob(job.id, { status: 'failed', progress: 100, error: message });
    publishProgress(job.id, { status: 'failed', progress: 100, error: message });
    if (job.webhookUrl) await notifyN8n(job.webhookUrl, { jobId: job.id, status: 'hata', progress: 100, error: message });
  }
}