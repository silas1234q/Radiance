/**
 * Keep-alive self-ping. Started once from server.ts.
 *
 * Render's free web tier spins the instance down after 15 minutes with no
 * *inbound* HTTP traffic, and the next request then pays a 30-60s cold start —
 * long enough that the app's launch connectivity probe gives up and shows the
 * offline gate. This job pings the service's own public URL every 10 minutes so
 * the idle timer never expires.
 *
 * Two things this deliberately does NOT do:
 *
 *   - It never pings localhost. Only traffic through Render's edge resets the
 *     idle timer, so the target must be the public origin (`RENDER_EXTERNAL_URL`,
 *     which Render injects automatically).
 *   - It hits `/api/health`, which touches no database. Neon's free compute-hour
 *     allowance is a small fraction of a month, so a keep-alive that queried the
 *     DB would burn through it. Neon's ~4s cold start is acceptable; Render's is
 *     not.
 *
 * A self-ping can only *keep* the service awake — it can't wake one that already
 * slept (deploy, crash, missed window), because nothing is left running to send
 * the ping. An external uptime pinger is the safety net for that.
 *
 * Free tier gives 750 instance-hours/month against a ~730-hour month, so the
 * ping is confined to a daytime window (default 06:00-24:00 ≈ 547 h/month).
 */
import cron, { ScheduledTask } from 'node-cron';
import { DateTime } from 'luxon';

const PING_PATH = '/api/health';
const PING_TIMEOUT_MS = 10_000;
/** Marks our own requests so morgan can skip logging them (see app.ts). */
const PING_USER_AGENT = 'radiance-keepalive';
/** 10 min leaves a 5-minute margin under Render's 15-minute idle timeout. */
const PING_CRON = '*/10 * * * *';
/** Without a retry, one transient failure opens a 20-minute gap — long enough to sleep. */
const RETRY_DELAY_MS = 30_000;

const DEFAULT_WINDOW = '6-24';
const DEFAULT_TIMEZONE = 'UTC';

/** Public origin to ping, or null when unconfigured (i.e. local dev). */
function getBaseUrl(): string | null {
  const url = process.env.KEEPALIVE_URL || process.env.RENDER_EXTERNAL_URL;
  return url ? url.replace(/\/+$/, '') : null;
}

function localNow(): DateTime {
  const zone = process.env.KEEPALIVE_TZ || DEFAULT_TIMEZONE;
  const dt = DateTime.now().setZone(zone);
  return dt.isValid ? dt : DateTime.now().setZone('UTC');
}

/**
 * Is it currently inside the active window? `KEEPALIVE_WINDOW` is
 * `startHour-endHour`, half-open [start, end) in `KEEPALIVE_TZ`.
 *
 * A window that wraps midnight (`22-6`) is supported. Equal bounds mean
 * always-on rather than never — a zero-length window would silently disable the
 * job, which is the one failure mode that's invisible until the app is slow.
 */
export function isWithinWindow(now: DateTime = localNow()): boolean {
  const raw = process.env.KEEPALIVE_WINDOW || DEFAULT_WINDOW;
  const match = /^\s*(\d{1,2})\s*-\s*(\d{1,2})\s*$/.exec(raw);
  const start = match ? Number(match[1]) : 6;
  const end = match ? Number(match[2]) : 24;

  if (!match || start > 24 || end > 24) {
    console.warn(`[keep-alive] Invalid KEEPALIVE_WINDOW "${raw}" — running 24/7.`);
    return true;
  }

  const hour = now.hour;
  if (start === end) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end; // wraps midnight
}

/** Ping our own public health endpoint. Resolves false instead of throwing. */
export async function pingSelf(): Promise<boolean> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return false;

  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseUrl}${PING_PATH}`, {
      method: 'GET',
      headers: { 'User-Agent': PING_USER_AGENT },
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    const elapsed = Date.now() - startedAt;
    if (!response.ok) {
      console.warn(`[keep-alive] ${response.status} in ${elapsed}ms`);
      return false;
    }
    console.log(`[keep-alive] ${response.status} in ${elapsed}ms`);
    return true;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[keep-alive] ping failed after ${Date.now() - startedAt}ms: ${reason}`);
    return false;
  }
}

async function runPingWithRetry(): Promise<void> {
  if (!isWithinWindow()) return;
  if (await pingSelf()) return;

  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  if (isWithinWindow()) await pingSelf();
}

let tasks: ScheduledTask[] = [];

/** Schedule the self-ping. Idempotent — safe to call once at boot. */
export function startKeepAlive(): void {
  if (tasks.length > 0) return;

  if (process.env.DISABLE_KEEPALIVE === '1') {
    console.log('[keep-alive] Disabled via DISABLE_KEEPALIVE=1');
    return;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    // Normal in local dev: no RENDER_EXTERNAL_URL, nothing to keep awake.
    console.log('[keep-alive] Disabled — no KEEPALIVE_URL or RENDER_EXTERNAL_URL set');
    return;
  }

  tasks.push(
    cron.schedule(PING_CRON, () => {
      void runPingWithRetry();
    }),
  );

  const window = process.env.KEEPALIVE_WINDOW || DEFAULT_WINDOW;
  const zone = process.env.KEEPALIVE_TZ || DEFAULT_TIMEZONE;
  console.log(`[keep-alive] Pinging ${baseUrl}${PING_PATH} every 10m (${window} ${zone})`);
}
