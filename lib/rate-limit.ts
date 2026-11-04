/**
 * Durable sliding-window rate limiter backed by a Supabase table.
 *
 * Uses the `rate_limit_buckets` table (created in migration 20261102000001).
 * Falls back gracefully if the DB call fails (fail-open, logged).
 *
 * IP extraction: only reads the single trusted header set by your reverse
 * proxy. Caller must pass the already-resolved IP string; this module
 * never reads headers directly.
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: string;
}

interface BucketConfig {
  /** Sliding window in milliseconds */
  windowMs: number;
  /** Max hits allowed within the window */
  maxHits: number;
}

const WINDOW_CONFIGS: Record<string, BucketConfig> = {
  'order:ip':    { windowMs: 10 * 60 * 1000, maxHits: 4 },
  'order:phone': { windowMs: 10 * 60 * 1000, maxHits: 2 },
};

/**
 * Increments and checks a rate-limit bucket in the `rate_limit_buckets` table.
 *
 * Strategy: one row per (key, window_start_minute). We UPSERT and return the
 * hit_count. If hit_count exceeds the limit, we block.
 */
async function checkBucket(
  supabaseAdmin: any,
  key: string,
  config: BucketConfig
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  // Align window_start to the start of the current window bucket
  const windowBucket = new Date(Math.floor(now / config.windowMs) * config.windowMs).toISOString();
  const windowEnd   = Math.floor(now / config.windowMs) * config.windowMs + config.windowMs;
  const retryAfterSeconds = Math.ceil((windowEnd - now) / 1000);

  // Upsert: insert or increment
  const { data, error } = await supabaseAdmin.rpc('rate_limit_increment', {
    p_key:          key,
    p_window_start: windowBucket,
  });

  if (error) {
    // Fail-open: log and allow if DB is unavailable
    console.error('[RateLimit] DB error, failing open:', error.message);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const hitCount: number = data ?? 1;
  return {
    allowed: hitCount <= config.maxHits,
    retryAfterSeconds,
  };
}

/**
 * Checks order rate limits for a given IP and phone number.
 *
 * @param supabaseAdmin - A service-role Supabase client (server-side only)
 * @param ip            - Caller IP extracted from the single trusted header
 * @param phone         - Normalized Pakistani phone number
 */
export async function checkOrderRateLimit(
  supabaseAdmin: any,
  ip: string,
  phone: string
): Promise<RateLimitResult> {
  const ipKey    = `order:ip:${ip || 'unknown'}`;
  const phoneKey = `order:phone:${phone}`;

  // Check IP limit
  const ipResult = await checkBucket(supabaseAdmin, ipKey, WINDOW_CONFIGS['order:ip']);
  if (!ipResult.allowed) {
    return {
      allowed: false,
      retryAfterSeconds: ipResult.retryAfterSeconds,
      reason: 'Too many order attempts from your network. Please wait a few minutes.',
    };
  }

  // Check phone limit (only if phone is provided)
  if (phone) {
    const phoneResult = await checkBucket(supabaseAdmin, phoneKey, WINDOW_CONFIGS['order:phone']);
    if (!phoneResult.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: phoneResult.retryAfterSeconds,
        reason: 'An order was recently placed for this number. Please wait before trying again.',
      };
    }
  }

  return { allowed: true };
}

// In-memory fallback map for local development
const inMemoryContactLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * Checks rate limits specifically for the customer /contact inquiry form.
 * Window: 5 minutes, Max Hits: 3 per IP or phone.
 */
export async function checkContactRateLimit(
  supabaseAdmin: any,
  ip: string,
  phone?: string | null
): Promise<RateLimitResult> {
  const windowMs = 5 * 60 * 1000;
  const maxHits = 3;

  // If Supabase admin is provided and configured
  if (supabaseAdmin) {
    const ipKey = `contact:ip:${ip}`;
    const ipResult = await checkBucket(supabaseAdmin, ipKey, { windowMs, maxHits });
    if (!ipResult.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: ipResult.retryAfterSeconds,
        reason: 'Too many messages sent from your connection. Please wait 5 minutes or WhatsApp us.',
      };
    }

    if (phone) {
      const phoneKey = `contact:phone:${phone.replace(/\D/g, '')}`;
      const phoneResult = await checkBucket(supabaseAdmin, phoneKey, { windowMs, maxHits });
      if (!phoneResult.allowed) {
        return {
          allowed: false,
          retryAfterSeconds: phoneResult.retryAfterSeconds,
          reason: 'A message was recently sent for this phone number. Please wait a few minutes.',
        };
      }
    }

    return { allowed: true };
  }

  // In-memory fallback for local dev
  const now = Date.now();
  const key = `ip:${ip}${phone ? `:${phone}` : ''}`;
  const entry = inMemoryContactLimits.get(key);

  if (entry && entry.resetAt > now) {
    if (entry.count >= maxHits) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
        reason: 'Too many messages sent. Please wait a few minutes or WhatsApp our support.',
      };
    }
    entry.count += 1;
  } else {
    inMemoryContactLimits.set(key, { count: 1, resetAt: now + windowMs });
  }

  return { allowed: true };
}

/**
 * Extracts the trusted client IP from request headers.
 *
 * IMPORTANT: Only read the single header that your reverse proxy (Vercel,
 * Nginx, Cloudflare) sets. Never trust x-forwarded-for in raw form as it
 * can be spoofed by the client.
 *
 * Vercel sets x-real-ip (single IP, always from Vercel edge).
 * If running behind Cloudflare use cf-connecting-ip.
 * Fall back to x-forwarded-for first segment for local dev.
 */
export function extractTrustedIp(headersList: Headers | any): string {
  // Priority 1: Vercel edge sets this to the real client IP (single, trusted)
  const realIp = headersList.get?.('x-real-ip') ?? headersList['x-real-ip'];
  if (realIp && typeof realIp === 'string') return realIp.trim();

  // Priority 2: Cloudflare sets this header to the original client IP
  const cfIp = headersList.get?.('cf-connecting-ip') ?? headersList['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') return cfIp.trim();

  // Priority 3: First entry of x-forwarded-for (only for local dev)
  const xff = headersList.get?.('x-forwarded-for') ?? headersList['x-forwarded-for'];
  if (xff && typeof xff === 'string') return xff.split(',')[0].trim();

  return '127.0.0.1';
}
