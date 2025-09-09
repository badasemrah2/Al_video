import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { updateJobByExternalId } from '@/lib/job-repo';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Manuel Replicate status check endpoint
export async function POST(request: NextRequest) {
  try {
    const { predictionId } = await request.json();

    if (!predictionId) {
      return NextResponse.json({ error: 'Prediction ID required' }, { status: 400 });
    }

    console.log('Checking Replicate prediction:', predictionId);

    // Replicate'ten prediction'ı al
    const prediction = await replicate.predictions.get(predictionId);
    
    console.log('Replicate status:', prediction.status);
    console.log('Replicate output:', prediction.output);

    // Database'de job var mı kontrol et
    let jobUpdated = false;
    
    if (prediction.status === 'succeeded' && prediction.output) {
      try {
        await updateJobByExternalId(predictionId, {
          status: 'completed',
          progress: 100,
          resultUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output,
          completedAt: new Date().toISOString(),
        });
        jobUpdated = true;
        console.log('Job updated in database');
      } catch (dbError) {
        console.log('Database update failed, job may not exist in DB:', dbError);
      }
    } else if (prediction.status === 'failed') {
      try {
        await updateJobByExternalId(predictionId, {
          status: 'failed',
          error: prediction.error || 'Generation failed',
        });
        jobUpdated = true;
      } catch (dbError) {
        console.log('Database update failed:', dbError);
      }
    }

    return NextResponse.json({
      predictionId,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      jobUpdated,
      logs: prediction.logs,
    });

  } catch (error) {
    console.error('Error checking prediction:', error);
    return NextResponse.json({ 
      error: 'Failed to check prediction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
