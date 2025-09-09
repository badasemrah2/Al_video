'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { TextToVideo } from '@/components/TextToVideo';
import { ImageToVideo } from '@/components/ImageToVideo';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ProgressBar } from '@/components/ProgressBar';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';

export default function Home() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const {
        currentJob,
        isGenerating,
        generateTextToVideo,
        generateImageToVideo,
        downloadVideo,
        temizle
    } = useVideoGeneration();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center space-x-3"
                        >
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    AI Video Stüdyosu
                                </h1>
                                <p className="text-sm text-muted-foreground hidden sm:block">
                                    AI ile harika videolar oluşturun
                                </p>
                            </div>
                        </motion.div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            >
                                {theme === 'light' ? (
                                    <Moon className="w-4 h-4" />
                                ) : (
                                    <Sun className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Debug Panel - Her Zaman Görünür */}
                        <Card className="p-4 bg-yellow-50 border-yellow-200">
                            <h3 className="font-semibold text-yellow-800 mb-2">🐛 Debug Panel</h3>
                            <div className="text-sm font-mono text-yellow-700">
                                <div>Current Job: {currentJob ? 'VAR' : 'YOK'}</div>
                                {currentJob && (
                                    <>
                                        <div>Job ID: {currentJob.id}</div>
                                        <div>Status: {currentJob.status}</div>
                                        <div>Progress: {currentJob.progress}%</div>
                                        <div>Result URL: {currentJob.resultUrl ? 'VAR' : 'YOK'}</div>
                                        <div>Type: {currentJob.type}</div>
                                    </>
                                )}
                                <div>Is Generating: {isGenerating ? 'EVET' : 'HAYIR'}</div>
                            </div>
                        </Card>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="overflow-hidden backdrop-blur-sm bg-background/80">
                                <Tabs defaultValue="metinden-video" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="metinden-video">
                                            Metinden Video
                                        </TabsTrigger>
                                        <TabsTrigger value="gorseldan-video">
                                            Görseldan Video
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="metinden-video" className="mt-6">
                                        <TextToVideo
                                            onGenerate={generateTextToVideo}
                                            isGenerating={isGenerating}
                                        />
                                    </TabsContent>

                                    <TabsContent value="gorseldan-video" className="mt-6">
                                        <ImageToVideo
                                            onGenerate={generateImageToVideo}
                                            isGenerating={isGenerating}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </Card>
                        </motion.div>

                        {/* Progress Bar */}
                        {currentJob && currentJob.status !== 'completed' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="p-6">
                                    <ProgressBar
                                        progress={currentJob.progress}
                                        status={currentJob.status}
                                        className="space-y-2"
                                    />
                                </Card>
                            </motion.div>
                        )}

                        {/* Video Player */}
                        {currentJob && currentJob.resultUrl && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <VideoPlayer
                                    src={currentJob.resultUrl}
                                    title={`${currentJob.type === 'text-to-video' ? 'Üretilen' : 'Canlandırılan'} Video`}
                                    onDownload={() => downloadVideo(currentJob.id)}
                                />
                            </motion.div>
                        )}

                        {/* Error Display */}
                        {currentJob && currentJob.status === 'failed' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="p-6 border-destructive">
                                    <div className="text-center space-y-3">
                                        <h3 className="text-lg font-semibold text-destructive">
                                            Üretim Başarısız
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {currentJob.error || 'Beklenmeyen bir hata oluştu'}
                                        </p>
                                        <Button onClick={temizle} variant="outline">
                                            Tekrar Dene
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="p-6 backdrop-blur-sm bg-background/80">
                                <h3 className="font-semibold mb-4">💡 İpuçları</h3>
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <div className="flex items-start space-x-2">
                                        <span className="text-primary font-medium">•</span>
                                        <span>Spesifik ve açıklayıcı promptlar kullanın</span>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <span className="text-primary font-medium">•</span>
                                        <span>Video üretimi 2-5 dakika sürebilir</span>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <span className="text-primary font-medium">•</span>
                                        <span>Farklı stiller deneyin</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>

            <footer className="border-t bg-background/80 backdrop-blur-sm mt-16">
                <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
                    <p>&copy; 2025 AI Video Stüdyosu. Yapay zeka ile muhteşem videolar oluşturun.</p>
                </div>
            </footer>
        </div>
    );
}
