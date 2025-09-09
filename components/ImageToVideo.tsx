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
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

const schema = z.object({
  prompt: z.string().optional(),
  duration: z.number().min(5).max(10),
  cfgScale: z.number().min(0).max(1),
  negativePrompt: z.string().optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  useAsStartImage: z.boolean(),
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
    watch,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: '',
      duration: 5,
      cfgScale: 0.5,
      negativePrompt: '',
      aspectRatio: '16:9',
      useAsStartImage: false,
      webhookUrl: '',
    },
  });

  const cfgScale = watch('cfgScale');
  const useAsStartImage = watch('useAsStartImage');

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
          Animate your images with AI-powered motion using Kling model
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
            <Label htmlFor="prompt">Video Description</Label>
            <Textarea
              {...register('prompt')}
              placeholder="Describe what you want to see in the video (e.g., 'a beautiful sunset over mountains', 'people walking in a busy street')..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Describe the motion, objects, and scene you want to generate
            </p>
          </div>

          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select onValueChange={(value) => setValue('duration', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select onValueChange={(value) => setValue('aspectRatio', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Usage Mode */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={useAsStartImage}
                onCheckedChange={(checked) => setValue('useAsStartImage', !!checked)}
              />
              <Label htmlFor="useAsStartImage">Use image as first frame</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {useAsStartImage
                ? "Image will be the exact first frame of the video"
                : "Image will be used as reference/scene element"
              }
            </p>
          </div>

          {/* n8n Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">n8n Webhook URL (Optional)</Label>
            <Input
              {...register('webhookUrl')}
              placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
              className="font-mono text-sm"
            />
            {errors.webhookUrl && (
              <p className="text-xs text-red-500">{errors.webhookUrl.message}</p>
            )}
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* CFG Scale */}
              <div className="space-y-2">
                <Label htmlFor="cfgScale">
                  CFG Scale: {cfgScale?.toFixed(1)}
                  <span className="text-xs text-muted-foreground ml-2">
                    (Higher = more prompt adherence)
                  </span>
                </Label>
                <Slider
                  value={[cfgScale || 0.5]}
                  onValueChange={([value]) => setValue('cfgScale', value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
                <Textarea
                  {...register('negativePrompt')}
                  placeholder="Things you don't want to see (e.g., 'blurry, distorted, low quality')..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Describe what you want to avoid in the video
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}