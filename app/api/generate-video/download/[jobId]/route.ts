import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/utils';
import { getPersistedUrl } from '@/lib/storage';
import { getJob as dbGetJob } from '@/lib/job-repo';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    // Try database first, then memory, then persisted storage
    let videoUrl = null;
    
    try {
      const dbJob = await dbGetJob(jobId);
      if (dbJob && dbJob.result_url) {
        videoUrl = dbJob.result_url;
      }
    } catch (error) {
      console.warn('[download] DB lookup failed, trying memory:', error);
    }
    
    if (!videoUrl) {
      const job = getJob(jobId);
      videoUrl = job?.resultUrl;
    }
    
    if (!videoUrl) {
      videoUrl = getPersistedUrl(jobId);
    }
    
    if (!videoUrl) {
      return NextResponse.json({ error: 'Video not ready' }, { status: 404 });
    }
    
    // Fetch the video file
    const videoResponse = await fetch(videoUrl);
    
    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoBlob = await videoResponse.blob();
    
    return new Response(videoBlob, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="video_${jobId}.mp4"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}