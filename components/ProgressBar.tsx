'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
  status: string;
  className?: string;
}

export function ProgressBar({ progress, status, className }: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {status === 'pending' && 'Başlatılıyor...'}
          {status === 'processing' && 'Video üretiliyor...'}
          {status === 'completed' && 'Video hazır!'}
          {status === 'failed' && 'Üretim başarısız'}
        </span>
        <span className="text-sm font-semibold">
          {Math.round(progress)}%
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {status === 'processing' && (
        <motion.div
          className="mt-2 text-xs text-muted-foreground"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Video karmaşıklığına bağlı olarak 2-5 dakika sürebilir
        </motion.div>
      )}
    </div>
  );
}