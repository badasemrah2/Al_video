// Placeholder storage helper. Swap with Supabase / R2 adapter later.

export interface PersistedAsset {
  jobId: string;
  url: string;
  createdAt: number;
}

const memoryAssets = new Map<string, PersistedAsset>();

export async function persistAndGetUrl(output: any, jobId: string): Promise<string> {
  // Attempt to robustly extract a video URL from various possible shapes.
  function isUrl(v: any) {
    return typeof v === 'string' && /^https?:\/\//.test(v) && /(\.mp4|\.webm|\/files\/|replicate\.delivery)/i.test(v);
  }

  function scan(value: any): string | undefined {
    if (!value) return undefined;
    if (isUrl(value)) return value;
    if (Array.isArray(value)) {
      // Prefer last video-like url in arrays
      for (let i = value.length - 1; i >= 0; i--) {
        const found = scan(value[i]);
        if (found) return found;
      }
    } else if (typeof value === 'object') {
      // Check common keys first
      const preferKeys = ['video','video_url','result','output','url','files'];
      for (const k of preferKeys) {
        if (k in value) {
          const found = scan((value as any)[k]);
          if (found) return found;
        }
      }
      // Fallback: scan all properties
      for (const v of Object.values(value)) {
        const found = scan(v);
        if (found) return found;
      }
    }
    return undefined;
  }

  let url = scan(output);
  if (!url && output && typeof output === 'object' && 'output' in output) {
    url = scan((output as any).output);
  }
  if (!url) {
    console.warn('[storage] Could not find real video URL, using fallback');
    url = `https://cdn.example.com/videos/${jobId}.mp4`;
  }
  memoryAssets.set(jobId, { jobId, url, createdAt: Date.now() });
  return url;
}

export function getPersistedUrl(jobId: string) {
  return memoryAssets.get(jobId)?.url;
}
