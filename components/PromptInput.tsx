'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const promptTemplates = [
  { 
    name: 'Sinematik Çekim',
    prompt: 'Gün batımında fütüristik bir şehrin sinematik kurulum çekimi, uçan arabalar ve neon ışıklar, dramatik aydınlatma, 4K kalite'
  },
  {
    name: 'Doğa Sahnesi',
    prompt: 'Yüksek ağaçların arasından süzülen güneş ışığı ile huzurlu bir orman, yaprakları hareket ettiren hafif rüzgar, barışçıl ve büyülü atmosfer'
  },
  {
    name: 'Soyut Sanat',
    prompt: 'Canlı renklerle dönüşen ve akan akışkan soyut şekiller, psikedelik desenler, yumuşak geçişler'
  },
  {
    name: 'Karakter Animasyonu',
    prompt: 'Renkli çizgi film tarzında merhaba diye el sallayan dostane robot karakter, yumuşak animasyon, neşeli ifade'
  },
];

export function PromptInput({ value, onChange, placeholder, maxLength = 500 }: PromptInputProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleTemplateSelect = (templateName: string) => {
    const template = promptTemplates.find(t => t.name === templateName);
    if (template) {
      onChange(template.prompt);
      setSelectedTemplate(templateName);
    }
  };

  const enhancePrompt = () => {
    if (value.trim()) {
      const enhancements = [
        'yüksek kalite',
        'detaylı',
        'yumuşak animasyon',
        '4K çözünürlük',
        'profesyonel sinematografi'
      ];
      
      const missingEnhancements = enhancements.filter(
        enhancement => !value.toLowerCase().includes(enhancement.toLowerCase())
      );
      
      if (missingEnhancements.length > 0) {
        const randomEnhancement = missingEnhancements[Math.floor(Math.random() * missingEnhancements.length)];
        onChange(`${value}, ${randomEnhancement}`);
      }
    }
  };

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">Video Açıklaması</Label>
        <div className="relative">
          <Textarea
            id="prompt"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Oluşturmak istediğiniz videoyu açıklayın..."}
            className="min-h-[120px] pr-12 resize-none"
            maxLength={maxLength}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={enhancePrompt}
            disabled={!value.trim()}
            className="absolute bottom-2 right-2 p-2"
            title="Prompt'u geliştir"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <motion.span
            className={`text-sm ${isNearLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            animate={{ color: isNearLimit ? '#ef4444' : '#6b7280' }}
          >
            {characterCount}/{maxLength} karakter
          </motion.span>
          
          <div className="text-xs text-muted-foreground">
            {characterCount < 10 && 'Minimum 10 karakter gerekli'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Hızlı Şablonlar</Label>
        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Bir şablon seçin..." />
          </SelectTrigger>
          <SelectContent>
            {promptTemplates.map((template) => (
              <SelectItem key={template.name} value={template.name}>
                <div className="flex items-center space-x-2">
                  <Wand2 className="w-4 h-4" />
                  <span>{template.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}