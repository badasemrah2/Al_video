import { NextRequest, NextResponse } from 'next/server';
import { ImageToVideoOptions, GenerationJob } from '@/lib/types';
import { generateImageToVideo } from '@/lib/replicate-client';
import { generateJobId, saveJob, updateJob, publishProgress } from '@/lib/utils';
import { persistAndGetUrl } from '@/lib/storage';
import { notifyN8n } from '@/lib/n8n-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const optionsStr = formData.get('options') as string;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!optionsStr) {
      return NextResponse.json(
        { error: 'No options provided' },
        { status: 400 }
      );
    }

    const options: ImageToVideoOptions = JSON.parse(optionsStr);

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image file must be smaller than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to base64 for API
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`;

    // Create job
    const job: GenerationJob = {
      id: generateJobId(),
      type: 'image-to-video',
      status: 'pending',
      progress: 0,
      prompt: options.prompt,
      imageUrl: imageDataUrl,
      createdAt: new Date(),
      webhookUrl: options.webhookUrl,
    };
    saveJob(job);
    publishProgress(job.id, { status: 'pending', progress: 0 });
    processImageToVideoGeneration(job, options, imageDataUrl).catch(console.error);
    return NextResponse.json(job);
  } catch (error) {
    console.error('Image-to-video generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processImageToVideoGeneration(job: GenerationJob, options: ImageToVideoOptions, imageDataUrl: string) {
  try {
    updateJob(job.id, { status: 'processing', progress: 5 });
    publishProgress(job.id, { status: 'processing', progress: 5 });
    const num_frames = options.duration * options.fps;
    const motion_bucket_id = options.motionIntensity === 'low' ? 40 : options.motionIntensity === 'high' ? 200 : 120;
    const output = await generateImageToVideo(imageDataUrl, { motion_bucket_id, fps: options.fps, num_frames });
    updateJob(job.id, { progress: 70 });
    publishProgress(job.id, { status: 'processing', progress: 70 });
    const resultUrl = await persistAndGetUrl(output, job.id);
    updateJob(job.id, { status: 'completed', progress: 100, resultUrl, completedAt: new Date() });
    publishProgress(job.id, { status: 'completed', progress: 100, resultUrl });
    if (job.webhookUrl) {
      await notifyN8n(job.webhookUrl, { jobId: job.id, status: 'tamamlandı', progress: 100, resultUrl });
    }
  } catch (error) {
    const message = (error as Error)?.message || 'Unknown error';
    updateJob(job.id, { status: 'failed', progress: 100, error: message });
    publishProgress(job.id, { status: 'failed', progress: 100, error: message });
    if (job.webhookUrl) {
      await notifyN8n(job.webhookUrl, { jobId: job.id, status: 'hata', progress: 100, error: message });
    }
    console.error('Image to video generation failed:', error);
  }
}