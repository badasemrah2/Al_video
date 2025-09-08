'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import imageCompression from 'browser-image-compression';

interface ImageUploaderProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  onImageRemove: () => void;
  selectedImage?: string;
  className?: string;
}

export function ImageUploader({ 
  onImageSelect, 
  onImageRemove, 
  selectedImage, 
  className 
}: ImageUploaderProps) {
  const [error, setError] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setError('Dosya boyutu 10MB\'dan küçük olmalıdır');
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Lütfen geçerli bir görsel dosyası seçin (JPG, PNG veya WebP)');
      }
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    try {
      setIsCompressing(true);
      
      // Görsel çok büyükse sıkıştır
      let processedFile = file;
      if (file.size > 5 * 1024 * 1024) { // 5MB'dan büyükse
        processedFile = await imageCompression(file, {
          maxSizeMB: 5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      }

      const previewUrl = URL.createObjectURL(processedFile);
      onImageSelect(processedFile, previewUrl);
    } catch (compressionError) {
      console.error('Görsel sıkıştırma başarısız:', compressionError);
      setError('Görsel işlenemedi. Lütfen farklı bir dosya deneyin.');
    } finally {
      setIsCompressing(false);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleRemoveImage = () => {
    onImageRemove();
    setError('');
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {!selectedImage ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-all duration-200
                ${isDragActive 
                  ? 'border-primary bg-primary/5 scale-105' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
                ${isCompressing ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />

              <motion.div
                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                className="space-y-4"
              >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {isCompressing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-primary" />
                )}
              </div>

              <div>
                <p className="text-lg font-medium">
                  {isCompressing ? 'Görsel işleniyor...' : 
                   isDragActive ? 'Görselinizi buraya bırakın' : 'Görsel yükleyin'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isCompressing ? 'Görselinizi optimize ederken lütfen bekleyin' :
                   'Sürükle bırak veya seçmek için tıklayın (JPG, PNG, WebP - 10MB\'a kadar)'}
                </p>
              </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group"
          >
            <div className="relative rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={selectedImage}
                  alt="Seçilen görsel"
                  width={1024}
                  height={1024}
                  className="w-full h-64 object-cover"
                />
              
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
              >
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="opacity-90 hover:opacity-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Görseli Kaldır
                </Button>
              </motion.div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span>Görsel animasyon için hazır</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}