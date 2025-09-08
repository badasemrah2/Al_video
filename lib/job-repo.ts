import { supabase } from './supabase';
import type { GenerationJob } from './types';

export interface CreateJobInput {
  externalId: string;
  type: string;
  prompt: string;
  negativePrompt?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  sourceImageUrl?: string;
  userId?: string;
}

export async function createJob(input: CreateJobInput) {
  const { data, error } = await supabase.from('jobs').insert({
    external_id: input.externalId,
    type: input.type,
    prompt: input.prompt,
    negative_prompt: input.negativePrompt,
    duration_seconds: input.durationSeconds,
    aspect_ratio: input.aspectRatio,
    source_image_url: input.sourceImageUrl,
    status: 'pending',
    progress: 0,
    user_id: input.userId || null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateJobByExternalId(externalId: string, patch: Partial<{status:string; progress:number; resultUrl:string; error:string; startedAt:string; completedAt:string;}>) {
  const map: any = {};
  if (patch.status !== undefined) map.status = patch.status;
  if (patch.progress !== undefined) map.progress = patch.progress;
  if (patch.resultUrl !== undefined) map.result_url = patch.resultUrl;
  if (patch.error !== undefined) map.error = patch.error;
  if (patch.startedAt !== undefined) map.started_at = patch.startedAt;
  if (patch.completedAt !== undefined) map.completed_at = patch.completedAt;

  const { data, error } = await supabase.from('jobs')
    .update(map)
    .eq('external_id', externalId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function appendEvent(externalId: string, status: string, progress: number, payload: any = {}) {
  const { data: job, error: jobErr } = await supabase.from('jobs').select('id').eq('external_id', externalId).single();
  if (jobErr) throw jobErr;
  const { error } = await supabase.from('job_events').insert({
    job_id: job.id,
    status,
    progress,
    payload
  });
  if (error) throw error;
}

export async function getJob(externalId: string) {
  const { data, error } = await supabase.from('jobs').select('*').eq('external_id', externalId).single();
  if (error) throw error;
  return data;
}

export interface ListJobsParams { status?: string; limit?: number; offset?: number; }
export async function listJobs(params: ListJobsParams = {}) {
  let q = supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (params.status) q = q.eq('status', params.status);
  if (params.limit) q = q.limit(params.limit);
  if (params.offset) q = q.range(params.offset, (params.offset + (params.limit || 20)) - 1);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
