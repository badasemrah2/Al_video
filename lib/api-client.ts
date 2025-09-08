import axios from 'axios';
import { VideoGenerationOptions, ImageToVideoOptions, GenerationJob, N8nWebhookPayload } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export class ApiClient {
  static async generateTextToVideo(options: VideoGenerationOptions): Promise<GenerationJob> {
    const response = await api.post('/generate-video/text', options);
    return response.data;
  }

  static async generateImageToVideo(
    imageFile: File, 
    options: ImageToVideoOptions
  ): Promise<GenerationJob> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('options', JSON.stringify(options));

    const response = await api.post('/generate-video/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  static async getJobStatus(jobId: string): Promise<GenerationJob> {
    const response = await api.get(`/generate-video/status/${jobId}`);
    return response.data;
  }

  static async downloadVideo(jobId: string): Promise<Blob> {
    const response = await api.get(`/generate-video/download/${jobId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // n8n webhook gönderimi
  static async sendN8nWebhook(webhookUrl: string, payload: N8nWebhookPayload): Promise<void> {
    try {
      await axios.post(webhookUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('n8n webhook gönderimi başarısız:', error);
    }
  }

  // n8n'den gelen webhook'ları işle
  static async processN8nWebhook(payload: any): Promise<GenerationJob> {
    const response = await api.post('/n8n/webhook', payload);
    return response.data;
  }
}