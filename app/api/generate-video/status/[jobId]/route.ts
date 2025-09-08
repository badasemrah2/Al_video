import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/utils';
import { getJob as dbGetJob } from '@/lib/job-repo';

// Ensure Node.js runtime (not edge) for stable intervals & streaming
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    // Check for SSE request (EventSource)
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/event-stream')) {
      const encoder = new TextEncoder();
      let closed = false;

      const stream = new ReadableStream({
        start(controller) {
          const send = (data: any) => {
            if (closed) return;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };
          const heartbeat = () => controller.enqueue(encoder.encode(`: ping\n\n`));

          // Initial push - try database first, then memory
          (async () => {
            let job = null;
            try {
              const dbJob = await dbGetJob(jobId);
              if (dbJob) {
                // Convert DB job to frontend format
                job = {
                  id: dbJob.external_id,
                  type: dbJob.type,
                  status: dbJob.status,
                  progress: dbJob.progress || 0,
                  prompt: dbJob.prompt,
                  resultUrl: dbJob.result_url,
                  error: dbJob.error,
                  createdAt: new Date(dbJob.created_at),
                };
              }
            } catch (error) {
              console.warn('[status SSE] DB lookup failed, falling back to memory:', error);
            }
            
            if (!job) {
              job = getJob(jobId);
            }
            
            if (job) {
              send(job);
            } else {
              // brief retry window for race; client will reconnect
              send({ id: jobId, status: 'not_found', retry: true });
            }
          })();

          const interval = setInterval(() => {
            const updated = getJob(jobId);
            if (updated) {
              send(updated);
              if (updated.status === 'completed' || updated.status === 'failed') {
                cleanup();
              }
            } else {
              // after first valid send, treat disappearance as terminal
              send({ id: jobId, status: 'not_found', terminal: true });
              cleanup();
            }
          }, 2000);

          const hb = setInterval(heartbeat, 15000);

          const cleanup = () => {
            if (closed) return;
            clearInterval(interval);
            clearInterval(hb);
            closed = true;
            try { controller.close(); } catch {}
          };

          request.signal.addEventListener('abort', cleanup);
        },
        cancel() {
          closed = true;
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'X-Accel-Buffering': 'no'
        }
      });
    }

    // Regular JSON response for non-SSE requests - try database first
    let job = null;
    try {
      const dbJob = await dbGetJob(jobId);
      if (dbJob) {
        // Convert DB job to frontend format
        job = {
          id: dbJob.external_id,
          type: dbJob.type,
          status: dbJob.status,
          progress: dbJob.progress || 0,
          prompt: dbJob.prompt,
          resultUrl: dbJob.result_url,
          error: dbJob.error,
          createdAt: new Date(dbJob.created_at),
          completedAt: dbJob.completed_at ? new Date(dbJob.completed_at) : undefined,
        };
      }
    } catch (error) {
      console.warn('[status] DB lookup failed, falling back to memory:', error);
    }
    
    if (!job) {
      job = getJob(jobId);
    }
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}