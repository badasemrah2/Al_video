'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageUploader } from './ImageUploader';
import { ImageToVideoOptions } from '@/lib/types';
import { Input } from '@/components/ui/input';

const schema = z.object({
  prompt: z.string().optional(),
  motionIntensity: z.enum(['low', 'medium', 'high']),
  cameraMovement: z.enum(['none', 'zoom_in', 'zoom_out', 'pan_left', 'pan_right']),
  duration: z.number().min(2).max(10),
  fps: z.number().int().min(24).max(60),
  webhookUrl: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface ImageToVideoProps {
  onGenerate: (file: File, options: ImageToVideoOptions) => void;
  isGenerating: boolean;
}

export function ImageToVideo({ onGenerate, isGenerating }: ImageToVideoProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: '',
      motionIntensity: 'medium',
      cameraMovement: 'none',
      duration: 4,
      fps: 30,
      webhookUrl: '',
    },
  });

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setSelectedImage(previewUrl);
  };

  const handleImageRemove = () => {
    setSelectedFile(null);
    setSelectedImage('');
  };

  const onSubmit = (data: FormData) => {
    if (selectedFile) {
      onGenerate(selectedFile, data);
    }
  };

  const canSubmit = isValid && selectedFile && !isGenerating;

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="w-5 h-5 text-primary" />
          <span>Image to Video</span>
        </CardTitle>
        <CardDescription>
          Animate your images with AI-powered motion
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <ImageUploader
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            selectedImage={selectedImage}
          />

          {/* Animation Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Animation Description (Optional)</Label>
            <Textarea
              {...register('prompt')}
              placeholder="Describe how you want the image to move (e.g., 'gentle wind blowing through hair', 'waves crashing on shore')..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for automatic motion detection and animation
            </p>
          </div>

          {/* Motion Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motionIntensity">Motion Intensity</Label>
              <Select onValueChange={(value) => setValue('motionIntensity', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div>
                      <div className="font-medium">Low</div>
                      <div className="text-xs text-muted-foreground">Subtle motion</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div>
                      <div className="font-medium">Medium</div>
                      <div className="text-xs text-muted-foreground">Balanced animation</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div>
                      <div className="font-medium">High</div>
                      <div className="text-xs text-muted-foreground">Dynamic motion</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cameraMovement">Camera Movement</Label>
              <Select onValueChange={(value) => setValue('cameraMovement', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select movement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="zoom_in">Zoom In</SelectItem>
                  <SelectItem value="zoom_out">Zoom Out</SelectItem>
                  <SelectItem value="pan_left">Pan Left</SelectItem>
                  <SelectItem value="pan_right">Pan Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">n8n Webhook URL (Optional)</Label>
            <Input
              {...register('webhookUrl')}
              placeholder="https://your-n8n-instance.com/webhook/video-generation"
              className="font-mono text-xs"
            />
            {errors.webhookUrl && (
              <p className="text-xs text-destructive">{errors.webhookUrl.message}</p>
            )}
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
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
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Select onValueChange={(value) => setValue('duration', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 seconds</SelectItem>
                      <SelectItem value="4">4 seconds</SelectItem>
                      <SelectItem value="6">6 seconds</SelectItem>
                      <SelectItem value="8">8 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fps">Frame Rate</Label>
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
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Button */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3"
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            {isGenerating ? 'Animating Image...' : 'Animate Image'}
          </Button>

          {!selectedFile && (
            <p className="text-sm text-muted-foreground text-center">
              Please upload an image to continue
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}