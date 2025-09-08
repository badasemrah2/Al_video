// Simple in-memory rate limiter (IP based). For production, replace with Redis/Upstash implementation.
const buckets = new Map<string, { count: number; reset: number }>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function rateLimitIdentify(ip?: string | null) {
  return ip || 'unknown';
}

export function checkRateLimit(key: string, opts?: Partial<RateLimitOptions>) {
  const env = (globalThis as any).process?.env || {};
  const limit = opts?.limit ?? parseInt(env.RATE_LIMIT_PER_DAY || '10');
  const windowMs = opts?.windowMs ?? 24 * 60 * 60 * 1000;
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, reset: now + windowMs };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, reset: existing.reset };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, reset: existing.reset };
}
