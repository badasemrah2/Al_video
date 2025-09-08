'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2, Settings, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PromptInput } from './PromptInput';
import { VideoGenerationOptions } from '@/lib/types';

const schema = z.object({
  prompt: z.string().min(10, 'Prompt en az 10 karakter olmalıdır'),
  negativePrompt: z.string().optional(),
  duration: z.number().min(2).max(10),
  fps: z.number().int().min(24).max(60),
  width: z.number().int(),
  height: z.number().int(),
  style: z.enum(['realistic', 'anime', 'cartoon', 'cinematic']),
  webhookUrl: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface TextToVideoProps {
  onGenerate: (options: VideoGenerationOptions) => void;
  isGenerating: boolean;
}

export function TextToVideo({ onGenerate, isGenerating }: TextToVideoProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showN8nSettings, setShowN8nSettings] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: '',
      negativePrompt: '',
      duration: 4,
      fps: 30,
      width: 768,
      height: 768,
      style: 'realistic',
      webhookUrl: '',
    },
  });

  const onSubmit = (data: FormData) => {
    onGenerate(data);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <span>Metinden Video</span>
        </CardTitle>
        <CardDescription>
          Metin açıklamalarınızdan harika videolar oluşturun
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Ana Prompt */}
          <div className="space-y-2">
            <PromptInput
              value={watch('prompt')}
              onChange={(value) => setValue('prompt', value)}
              placeholder="Oluşturmak istediğiniz videoyu açıklayın..."
            />
            {errors.prompt && (
              <p className="text-sm text-destructive">{errors.prompt.message}</p>
            )}
          </div>

          {/* Temel Ayarlar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="style">Stil <span className="text-xs text-muted-foreground">(çıktı prompt&apos;una otomatik eklenecek)</span></Label>
              <Select onValueChange={(value) => setValue('style', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Stil seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Gerçekçi</SelectItem>
                  <SelectItem value="cinematic">Sinematik</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="cartoon">Çizgi Film</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Süre (saniye)</Label>
              <Select onValueChange={(value) => setValue('duration', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Süre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 saniye</SelectItem>
                  <SelectItem value="4">4 saniye</SelectItem>
                  <SelectItem value="6">6 saniye</SelectItem>
                  <SelectItem value="8">8 saniye</SelectItem>
                  <SelectItem value="10">10 saniye</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fps">Kare Hızı</Label>
              <Select onValueChange={(value) => setValue('fps', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="FPS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 FPS</SelectItem>
                  <SelectItem value="30">30 FPS</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* n8n Webhook Ayarları */}
          <Collapsible open={showN8nSettings} onOpenChange={setShowN8nSettings}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Webhook className="w-4 h-4 mr-2" />
                n8n Entegrasyonu
                <motion.div
                  animate={{ rotate: showN8nSettings ? 180 : 0 }}
                  className="ml-auto"
                >
                  ▼
                </motion.div>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4">
              <div className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">n8n Webhook URL&apos;i (Opsiyonel)</Label>
                  <Input
                    {...register('webhookUrl')}
                    placeholder="https://your-n8n-instance.com/webhook/video-generation"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Video üretimi tamamlandığında n8n workflow&apos;unuza bildirim gönderilir
                  </p>
                  {errors.webhookUrl && (
                    <p className="text-sm text-destructive">{errors.webhookUrl.message}</p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          {/* Gelişmiş Ayarlar */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Gelişmiş Ayarlar
                <motion.div
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  className="ml-auto"
                >
                  ▼
                </motion.div>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label>Çözünürlük</Label>
                  <Select onValueChange={(value) => {
                    const [w, h] = value.split('x').map(Number);
                    setValue('width', w);
                    setValue('height', h);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Çözünürlük seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="512x512">512x512 (Kare)</SelectItem>
                      <SelectItem value="768x768">768x768 (Kare HD)</SelectItem>
                      <SelectItem value="1024x1024">1024x1024 (Kare Full HD)</SelectItem>
                      <SelectItem value="768x432">768x432 (16:9 Geniş)</SelectItem>
                      <SelectItem value="432x768">432x768 (9:16 Dikey)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Negatif Prompt (Opsiyonel)</Label>
                <Textarea
                  {...register('negativePrompt')}
                  placeholder="Videoda istemediğiniz şeyler..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Üretilen videoda kaçınmak istediğiniz şeyleri belirtin
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Üret Düğmesi */}
          <Button
            type="submit"
            disabled={!isValid || isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3"
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Wand2 className="w-5 h-5 mr-2" />
            )}
            {isGenerating ? 'Video Üretiliyor...' : 'Video Üret'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}