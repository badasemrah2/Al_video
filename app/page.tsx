'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Sparkles, Video, Zap, Image as ImageIcon, Clock, FileText } from 'lucide-react';
import { TextToVideo } from '@/components/TextToVideo';
import { ImageToVideo } from '@/components/ImageToVideo';
import { GenerationHistory } from '@/components/GenerationHistory';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { GenerationJob } from '@/lib/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('text-to-video');
  const [generationHistory, setGenerationHistory] = useLocalStorage<GenerationJob[]>('generation_history', []);
  
  const {
    currentJob,
    isGenerating,
    generateTextToVideo,
    generateImageToVideo,
    downloadVideo,
    manualCheckStatus,
    temizle
  } = useVideoGeneration();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as GenerationJob;
      if (!detail) return;
      setGenerationHistory(prev => {
        if (prev.some(j => j.id === detail.id)) return prev;
        return [detail, ...prev].slice(0, 100);
      });
    };
    window.addEventListener('videoJobCompleted', handler as EventListener);
    return () => window.removeEventListener('videoJobCompleted', handler as EventListener);
  }, [setGenerationHistory]);

  if (!mounted) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              AI Video Studio
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create stunning videos from text prompts or transform images into captivating animations using cutting-edge AI
            </p>
          </motion.div>

          {/* Debug Panel - Compact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Debug Status</span>
                </div>
                <div className="text-sm font-mono text-yellow-700">
                  {currentJob ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>Status: <span className="font-bold">{currentJob.status}</span></div>
                      <div>Progress: <span className="font-bold">{currentJob.progress}%</span></div>
                      <div>Video: <span className="font-bold">{currentJob.resultUrl ? 'READY' : 'PENDING'}</span></div>
                      <div>ID: <span className="text-xs">{currentJob.id ? currentJob.id.slice(-6) : ''}</span></div>
                    </div>
                  ) : (
                    <div>No active generation</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generation Panel */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="overflow-hidden backdrop-blur-sm bg-background/80">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text-to-video" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Text to Video
                      </TabsTrigger>
                      <TabsTrigger value="image-to-video" className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Image to Video
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text-to-video" className="mt-6">
                      <TextToVideo 
                        onGenerate={generateTextToVideo}
                        isGenerating={isGenerating}
                      />
                    </TabsContent>
                    
                    <TabsContent value="image-to-video" className="mt-6">
                      <ImageToVideo 
                        onGenerate={generateImageToVideo}
                        isGenerating={isGenerating}
                      />
                    </TabsContent>
                  </Tabs>
                </Card>
              </motion.div>
            </div>

            {/* Status and Results Panel */}
            <div className="space-y-6">
              {/* Current Generation Status */}
              {currentJob && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Current Generation
                        </span>
                        <Badge variant={currentJob.status === 'completed' ? 'default' : currentJob.status === 'failed' ? 'destructive' : 'secondary'}>
                          {currentJob.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentJob.status === 'processing' && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium">{currentJob.progress}%</span>
                          </div>
                          <Progress value={currentJob.progress} />
                        </div>
                      )}
                      
                      {currentJob.status === 'completed' && currentJob.resultUrl && (
                        <div>
                          <VideoPlayer 
                            src={currentJob.resultUrl} 
                            className="w-full rounded-lg shadow-md mb-4" 
                          />
                          <Button 
                            onClick={() => downloadVideo(currentJob.id)}
                            className="w-full flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download Video
                          </Button>
                        </div>
                      )}
                      
                      {currentJob.status === 'failed' && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {currentJob.error || 'An error occurred during video generation'}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {(currentJob.status === 'pending' || currentJob.status === 'processing') && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {currentJob.status === 'pending' ? 'Initializing generation...' : 'Processing video...'}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Generation History */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GenerationHistory 
                  jobs={generationHistory}
                  onDownload={downloadVideo}
                  onDelete={(jobId) => {
                    setGenerationHistory(prev => prev.filter(job => job.id !== jobId));
                  }}
                  onClearAll={() => setGenerationHistory([])}
                  onManualCheck={manualCheckStatus}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}