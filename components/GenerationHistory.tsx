'use client';

import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Clock, Download, Trash2, Image as ImageIcon, Type, Copy, Check, Video as VideoIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GenerationJob } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

interface GenerationHistoryProps {
  jobs: GenerationJob[];
  onDownload: (jobId: string, filename?: string) => void;
  onDelete: (jobId: string) => void;
  onClearAll?: () => void;
}

export function GenerationHistory({ jobs, onDownload, onDelete, onClearAll }: GenerationHistoryProps) {
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'all' | GenerationJob['status']>('all');

  const exportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation_history_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('export failed', e);
    }
  };

  const filtered = React.useMemo(() => {
    let list = jobs;
    if (statusFilter !== 'all') list = list.filter(j => j.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(j => (j.prompt || '').toLowerCase().includes(q) || j.id.includes(q));
    }
    return list;
  }, [jobs, query, statusFilter]);

  const isEmpty = jobs.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">History</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filtered.length}/{jobs.length}</Badge>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs border rounded px-1 py-1 bg-background"
              title="Durum filtresi"
            >
              <option value="all">all</option>
              <option value="completed">completed</option>
              <option value="processing">processing</option>
              <option value="pending">pending</option>
              <option value="failed">failed</option>
            </select>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={exportJson}>JSON</Button>
            {onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => { if (confirm('Tüm geçmiş silinsin mi?')) onClearAll(); }}
              >
                Temizle
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="w-full rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring"
            placeholder="Ara (prompt veya id)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {isEmpty && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <Clock className="w-12 h-12 text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Henüz kayıt yok</h3>
              <p className="text-muted-foreground text-sm">Oluşturduğun videolar burada listelenecek</p>
            </div>
            <div className="text-xs text-muted-foreground">Bir video üret ve burada görünsün</div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
  {filtered.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            layout
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {job.type === 'text-to-video' ? (
                      <Type className="w-4 h-4 text-purple-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    )}
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {job.type === 'text-to-video' ? 'Text to Video' : 'Image to Video'}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-2">
                        <span>{timeAgo(job.createdAt)}</span>
                        {job.completedAt && <span className="text-[10px] text-muted-foreground/70">• {(Math.max(0, (new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()))/1000).toFixed(1)}s</span>}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {job.status === 'completed' && <Badge className="bg-green-600 hover:bg-green-600"><VideoIcon className="w-3 h-3 mr-1" />ok</Badge>}
                    {job.status === 'failed' && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />fail</Badge>}
                    {job.status === 'processing' && <Badge variant="secondary">%{Math.round(job.progress)}</Badge>}
                    {job.status === 'pending' && <Badge variant="outline">pending</Badge>}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {job.prompt && (
                  <div className="text-xs text-muted-foreground">
                    <button
                      onClick={() => setExpanded(p => ({ ...p, [job.id]: !p[job.id] }))}
                      className="underline mr-2"
                    >
                      {expanded[job.id] ? 'Kısalt' : 'Göster'}
                    </button>
                    <span className={expanded[job.id] ? '' : 'line-clamp-2'}>
                      {job.prompt}
                    </span>
                  </div>
                )}

                {job.imageUrl && (
                  <div className="mb-3 w-16 h-16 relative border rounded overflow-hidden">
                    <Image
                      src={job.imageUrl}
                      alt="Source image"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}

                {job.resultUrl && job.status === 'completed' && (
                  <div className="relative group rounded overflow-hidden border w-full aspect-video bg-black/50">
                    <video
                      src={job.resultUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2 text-[10px] text-white justify-between">
                      <span>{job.id.slice(-8)}</span>
                      {job.completedAt && <span>{timeAgo(job.completedAt)}</span>}
                    </div>
                  </div>
                )}

                {job.status === 'processing' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Processing...</span>
                      <span>{Math.round(job.progress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px]">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <span className="font-mono">{job.id.slice(-6)}</span>
                    {job.createdAt && <span className="text-xs text-muted-foreground/70">{new Date(job.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {job.status === 'completed' && job.resultUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(job.id, `video_${job.id.slice(-8)}.mp4`)}
                          className="h-7 px-2"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(job.resultUrl!);
                            setCopiedId(job.id);
                            setTimeout(() => setCopiedId(p => p === job.id ? null : p), 1500);
                          }}
                          className="h-7 px-2"
                        >
                          {copiedId === job.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(job.id)}
                      className="h-7 px-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {job.error && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                    {job.error}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}