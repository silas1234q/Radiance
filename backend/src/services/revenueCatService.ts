/**
 * Server-side RevenueCat entitlement verification.
 *
 * The frontend identifies each customer with their Clerk user id
 * (`Purchases.logIn(clerkUserId)`), so RevenueCat's `app_user_id` equals the
 * Clerk user id — which the backend reads from `getAuth(req).userId`. We query
 * RevenueCat's REST API with the SECRET key (never the public SDK key) to get
 * an authoritative, tamper-proof view of the customer's entitlements.
 */

const RC_SECRET = process.env.REVENUECAT_SECRET_KEY;
const RC_API_BASE = 'https://api.revenuecat.com/v1';

/** Must match the entitlement identifier configured in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT = 'Radiance Pro';

/** Whether server-side verification is configured (secret key present). */
export function isConfigured(): boolean {
  return !!RC_SECRET;
}

interface RCEntitlement {
  expires_date: string | null;
  purchase_date: string;
  product_identifier: string;
}

/**
 * Returns true if the given RevenueCat app user id currently has the Radiance
 * Pro entitlement active. Returns false on any error or when the secret key is
 * not configured — callers should decide their own fallback for the
 * unconfigured case via `isConfigured()`.
 */
export async function hasProEntitlement(appUserId: string): Promise<boolean> {
  if (!RC_SECRET || !appUserId) return false;

  try {
    const res = await fetch(
      `${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`,
      {
        headers: {
          Authorization: `Bearer ${RC_SECRET}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // 404 = RevenueCat has never seen this subscriber (no purchase) → not Pro.
    if (res.status === 404) return false;
    if (!res.ok) {
      console.warn(`[RevenueCat] entitlement check HTTP ${res.status} for ${appUserId}`);
      return false;
    }

    const data = (await res.json()) as {
      subscriber?: { entitlements?: Record<string, RCEntitlement> };
    };

    const entitlement = data.subscriber?.entitlements?.[PRO_ENTITLEMENT];
    if (!entitlement) return false;

    // A null expiry means a non-expiring (lifetime) grant; otherwise it must be
    // in the future to count as active.
    const { expires_date } = entitlement;
    return expires_date === null || new Date(expires_date).getTime() > Date.now();
  } catch (err) {
    console.warn('[RevenueCat] entitlement check error', err);
    return false;
  }
}
