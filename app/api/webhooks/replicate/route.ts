import { NextRequest, NextResponse } from 'next/server';
import { updateJobByExternalId, appendEvent } from '@/lib/job-repo';
import { updateJob, publishProgress } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Get job ID from query params
    const url = new URL(request.url);
    const jobId = url.searchParams.get('job_id');
    
    if (!jobId) {
      console.warn('[replicate-webhook] No job_id in query params');
      return NextResponse.json({ error: 'job_id required' }, { status: 400 });
    }
    
    const payload = await request.json();
    console.log('[replicate-webhook] Received:', JSON.stringify(payload, null, 2));

    // Replicate webhook format analysis
    const { id: replicateId, status, output, error } = payload;
    
    if (status === 'succeeded' && output) {
      // Extract video URL from output
      const resultUrl = extractVideoUrl(output);
      console.log('[replicate-webhook] Extracted URL:', resultUrl);

      // Update both DB and memory
      await updateJobByExternalId(jobId, { 
        status: 'completed', 
        progress: 100, 
        resultUrl,
        completedAt: new Date().toISOString() 
      });
      
      await appendEvent(jobId, 'completed', 100, { 
        replicateId, 
        resultUrl, 
        webhookReceived: true 
      });

      updateJob(jobId, { status: 'completed', progress: 100, resultUrl });
      publishProgress(jobId, { status: 'completed', progress: 100, resultUrl });

      console.log('[replicate-webhook] Job completed:', jobId, resultUrl);
      
    } else if (status === 'failed' || error) {
      const errorMsg = error?.detail || error?.message || 'Video generation failed';
      
      // Update both DB and memory
      await updateJobByExternalId(jobId, { 
        status: 'failed', 
        progress: 100, 
        error: errorMsg,
        completedAt: new Date().toISOString() 
      });
      
      await appendEvent(jobId, 'failed', 100, { 
        replicateId, 
        error: errorMsg,
        webhookReceived: true 
      });

      updateJob(jobId, { status: 'failed', progress: 100, error: errorMsg });
      publishProgress(jobId, { status: 'failed', progress: 100, error: errorMsg });

      console.log('[replicate-webhook] Job failed:', jobId, errorMsg);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('[replicate-webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function extractVideoUrl(output: any): string {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0) return output[0];
  if (output?.url) return output.url;
  if (output?.video_url) return output.video_url;
  return output?.toString() || '';
}
