import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { GenerationJob } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// In-memory job store + subscriber map (SSE or future WS upgrade)
interface ProgressEventPayload {
  status: string;
  progress: number;
  resultUrl?: string;
  error?: string;
  [k: string]: any;
}

const jobStore = new Map<string, GenerationJob & { updatedAt: number }>();
const subscribers = new Map<string, Set<(data: ProgressEventPayload) => void>>();

export function saveJob(job: GenerationJob) {
  jobStore.set(job.id, { ...job, updatedAt: Date.now() });
}

export function updateJob(jobId: string, patch: Partial<GenerationJob>) {
  const existing = jobStore.get(jobId);
  if (!existing) return;
  const updated = { ...existing, ...patch, updatedAt: Date.now() };
  jobStore.set(jobId, updated);
  return updated;
}

export function getJob(jobId: string) {
  return jobStore.get(jobId);
}

export function getAllJobs(): GenerationJob[] {
  return Array.from(jobStore.values()).map(({ updatedAt, ...job }) => job);
}

export function subscribe(jobId: string, fn: (data: ProgressEventPayload) => void) {
  let set = subscribers.get(jobId);
  if (!set) {
    set = new Set();
    subscribers.set(jobId, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
    if (set && set.size === 0) subscribers.delete(jobId);
  };
}

export function publishProgress(jobId: string, payload: ProgressEventPayload) {
  const subs = subscribers.get(jobId);
  if (subs) {
    for (const fn of subs) {
      try { fn(payload); } catch (e) { console.error('progress subscriber error', e); }
    }
  }
}

// Clean old jobs (simple memory GC helper)
export function pruneJobs(maxAgeMs = 6 * 60 * 60 * 1000) { // 6h
  const now = Date.now();
  for (const [id, job] of jobStore.entries()) {
    if (now - job.updatedAt > maxAgeMs) jobStore.delete(id);
  }
}

export function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}

export function timeAgo(input: Date | string | number) {
  try {
    const date = input instanceof Date ? input : new Date(input);
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return sec <= 1 ? 'şimdi' : `${sec}s`; // seconds
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}dk`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}saat`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}gün`;
    const week = Math.floor(day / 7);
    if (week < 4) return `${week}hf`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month}ay`;
    const year = Math.floor(day / 365);
    return `${year}yıl`;
  } catch {
    return '';
  }
}
