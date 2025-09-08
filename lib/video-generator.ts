import { ApiClient } from './api-client';
import type { N8nWebhookPayload } from './types';

export class VideoGenerator {
  private static readonly REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
  
  static async createPrediction(input: any, model: string) {
    const response = await fetch(this.REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${(globalThis as any).process?.env?.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model,
        input,
      }),
    });

    if (!response.ok) {
      throw new Error(`API isteği başarısız: ${response.statusText}`);
    }

    return response.json();
  }

  static async getPrediction(predictionId: string) {
    const response = await fetch(`${this.REPLICATE_API_URL}/${predictionId}`, {
      headers: {
        'Authorization': `Token ${(globalThis as any).process?.env?.REPLICATE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Tahmin getirme başarısız: ${response.statusText}`);
    }

    return response.json();
  }

  static generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // n8n webhook bildirimi gönder
  static async notifyN8n(webhookUrl: string, jobId: string, status: string, progress: number, resultUrl?: string, error?: string) {
    if (!webhookUrl) return;

    const payload: N8nWebhookPayload = {
      jobId,
      status: status as any,
      progress,
      resultUrl,
      error,
      executionId: `exec_${Date.now()}`,
    };

    await ApiClient.sendN8nWebhook(webhookUrl, payload);
  }
}