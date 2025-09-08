export interface N8nNotifyPayload {
  jobId: string;
  status: string;
  progress: number;
  resultUrl?: string;
  error?: string;
  executionId?: string;
  timestamp: string;
}

export async function notifyN8n(webhookUrl: string, payload: Omit<N8nNotifyPayload, 'timestamp'>) {
  if (!webhookUrl) return;
  try {
    const body: N8nNotifyPayload = { ...payload, timestamp: new Date().toISOString() };
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (e) {
    console.error('[n8n-client] notify failed', e);
  }
}
