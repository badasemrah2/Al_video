import { NextRequest } from 'next/server';
import { subscribe } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const { jobId } = params;
  return new Response(new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      function send(data: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }
      const unsub = subscribe(jobId, (payload) => send(payload));
      // initial heartbeat
      const heartbeat = setInterval(() => controller.enqueue(encoder.encode(': ping\n\n')), 15000);
      send({ status: 'subscribed', progress: 0 });
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsub();
        controller.close();
      });
    }
  }), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked'
    }
  });
}
