'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { GenerationJob, VideoGenerationOptions, ImageToVideoOptions } from '@/lib/types';
import { toast } from 'sonner';

export function useVideoGeneration() {
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);

  // Polling-based job status checking (replaces SSE)
  const { data: polledJob, isLoading: polling } = useQuery({
    queryKey: ['job-status', currentJob?.id],
    queryFn: () => currentJob ? ApiClient.getJobStatus(currentJob.id) : null,
    enabled: !!currentJob && currentJob.status !== 'completed' && currentJob.status !== 'failed',
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Update current job when polled data comes in
  useEffect(() => {
    if (polledJob) {
      setCurrentJob(polledJob);
      
      // Show completion/error toasts
      if (polledJob.status === 'completed') {
        toast.success('Video generation completed successfully!');
        
        // Save to localStorage history
        try {
          const raw = localStorage.getItem('generation_history');
          const list: GenerationJob[] = raw ? JSON.parse(raw) : [];
          const existing = list.findIndex(j => j.id === polledJob.id);
          if (existing >= 0) {
            list[existing] = polledJob;
          } else {
            list.unshift(polledJob);
          }
          localStorage.setItem('generation_history', JSON.stringify(list.slice(0, 50)));
          window.dispatchEvent(new CustomEvent('videoJobCompleted', { detail: polledJob }));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
      } else if (polledJob.status === 'failed') {
        toast.error(polledJob.error || 'Video generation failed');
      }
    }
  }, [polledJob]);

  const generateTextToVideo = useCallback(async (options: VideoGenerationOptions) => {
    try {
      const response = await ApiClient.generateTextToVideo(options);
      setCurrentJob(response);
      toast.success('Video üretimi başlatıldı!');
      return response;
    } catch (error) {
      console.error('Video generation failed:', error);
      toast.error('Failed to start video generation');
      throw error;
    }
  }, []);

  const generateImageToVideo = useCallback(async (file: File, options: ImageToVideoOptions) => {
    try {
      const response = await ApiClient.generateImageToVideo(file, options);
      setCurrentJob(response);
      toast.success('Görsel animasyonu başlatıldı!');
      return response;
    } catch (error) {
      console.error('Image to video generation failed:', error);
      toast.error('Failed to start image to video generation');
      throw error;
    }
  }, []);

  const downloadVideo = useCallback(async (jobId: string, filename?: string) => {
    try {
      // First try the API endpoint
      try {
        const blob = await ApiClient.downloadVideo(jobId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `video_${jobId}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Video başarıyla indirildi!');
        return;
      } catch (apiError) {
        console.warn('API download failed, trying direct URL:', apiError);
      }
      
      // Fallback: Direct download from result URL
      const currentJobData = polledJob || currentJob;
      if (currentJobData?.resultUrl) {
        const a = document.createElement('a');
        a.href = currentJobData.resultUrl;
        a.download = filename || `video_${jobId}.mp4`;
        a.target = '_blank'; // Open in new tab for cross-origin URLs
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Video download başlatıldı!');
      } else {
        throw new Error('Video URL bulunamadı');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Video indirilemedi');
    }
  }, [polledJob, currentJob]);

  const clearCurrentJob = useCallback(() => {
    setCurrentJob(null);
  }, []);

  const manualCheckStatus = useCallback(async (jobId: string) => {
    try {
      toast.loading('Checking Replicate status...');
      
      const response = await fetch('/api/replicate/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId: jobId }),
      });

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      const result = await response.json();
      toast.dismiss();
      
      if (result.status === 'succeeded') {
        toast.success('Video found! Updating status...');
        // Trigger a refresh of current job
        if (currentJob && currentJob.id === jobId) {
          const updatedJob = await ApiClient.getJobStatus(jobId);
          if (updatedJob) {
            setCurrentJob(updatedJob);
          }
        }
        // Trigger history refresh
        window.dispatchEvent(new CustomEvent('videoJobCompleted'));
      } else if (result.status === 'failed') {
        toast.error(`Generation failed: ${result.error || 'Unknown error'}`);
      } else {
        toast.info(`Status: ${result.status}`);
      }

      console.log('Manual check result:', result);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to check status');
      console.error('Manual check failed:', error);
    }
  }, [currentJob]);

  return {
    currentJob: polledJob || currentJob,
    isGenerating: polling || Boolean(currentJob && ['pending', 'processing'].includes(currentJob.status)),
    generateTextToVideo,
    generateImageToVideo,
    downloadVideo,
    clearCurrentJob,
    manualCheckStatus,
    temizle: clearCurrentJob, // Turkish alias
  };
}