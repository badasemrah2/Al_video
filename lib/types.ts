export interface VideoGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  style: 'realistic' | 'anime' | 'cartoon' | 'cinematic';
  webhookUrl?: string; // n8n webhook URL'i
  cfgScale?: number; // Kling cfg_scale
  aspectRatio?: string; // Kling aspect_ratio (e.g. "1:1", "16:9")
}

export interface ImageToVideoOptions {
  prompt?: string;
  duration: number; // Duration in seconds (5 or 10)
  cfgScale?: number; // Flexibility (0-1)
  negativePrompt?: string; // What not to include
  aspectRatio?: string; // "16:9", "9:16", "1:1"
  useAsStartImage?: boolean; // Use image as first frame vs reference
  webhookUrl?: string; // n8n webhook URL'i
}

export interface GenerationJob {
  id: string;
  type: 'text-to-video' | 'image-to-video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  prompt?: string;
  imageUrl?: string;
  resultUrl?: string;
  createdAt: Date;
  completedAt?: Date | string;
  error?: string;
  webhookUrl?: string;
  n8nExecutionId?: string; // n8n execution ID
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  onDownload?: () => void;
}

export interface N8nWebhookPayload {
  jobId: string;
  status: 'başladı' | 'işleniyor' | 'tamamlandı' | 'başarısız';
  progress: number;
  resultUrl?: string;
  error?: string;
  executionId?: string;
}