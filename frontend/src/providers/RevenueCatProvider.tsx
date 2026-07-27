import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useAuth } from '@clerk/clerk-expo';

export { PAYWALL_RESULT };

/** Outcome of presenting the paywall, so callers can tell cancel from failure. */
export type PaywallOutcome = {
  /** The customer is entitled to Radiance Pro after the flow. */
  entitled: boolean;
  /** Raw paywall result, or a reason it couldn't be presented. */
  result: PAYWALL_RESULT | 'ERROR' | 'UNAVAILABLE';
  /** Friendly, user-facing message to show on failure (absent on success/cancel). */
  message?: string;
};

/**
 * Maps a RevenueCat purchase/restore error to a friendly, actionable message.
 * Never surface the SDK's raw error strings to users.
 */
function friendlyPurchaseError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return 'No internet connection. Check your network and try again.';
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return 'The App Store is having trouble right now. Please try again in a moment.';
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return "Purchases aren't allowed on this device. Check your device settings.";
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return "Your purchase is pending approval. We'll unlock Pro once it's confirmed.";
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return 'You already own this subscription — try "Restore Purchases".';
    default:
      return 'Something went wrong with your purchase. Please try again.';
  }
}

/**
 * The entitlement identifier configured in the RevenueCat dashboard. A customer
 * with this entitlement active has full "Radiance Pro" access.
 * Must match the identifier in RevenueCat exactly.
 */
export const PRO_ENTITLEMENT = 'Radiance Pro';

/**
 * Public SDK key (safe to ship in the client). Configured in `.env` as
 * EXPO_PUBLIC_REVENUECAT_API_KEY.
 */
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

function hasPro(info: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[PRO_ENTITLEMENT];
}

/**
 * Loading state of the current offering's packages. `error` covers both a failed
 * fetch and a fetch that succeeded but returned no purchasable packages (an
 * unconfigured/unavailable offering) — either way the UI should offer a retry
 * rather than hang on "Loading plans…".
 */
export type OfferingsStatus = 'loading' | 'loaded' | 'error';

interface RevenueCatContextValue {
  /** SDK configured and initial customer info loaded. */
  isReady: boolean;
  /** Whether the current customer has the Radiance Pro entitlement. */
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  /** Loading state of the current offering's purchasable packages. */
  offeringsStatus: OfferingsStatus;
  /** Re-fetch the current offering's packages (used to retry after a failure). */
  refreshOfferings: () => Promise<void>;
  /** Re-fetch the latest customer info from RevenueCat. */
  refresh: () => Promise<void>;
  /**
   * Present the RevenueCat paywall (current offering). Resolves `true` if the
   * customer ends up entitled (purchased, restored, or already Pro).
   */
  presentPaywall: () => Promise<boolean>;
  /**
   * Present the paywall only if the customer isn't already Pro. Resolves an
   * outcome describing whether they're entitled and how the flow ended.
   */
  presentPaywallIfNeeded: () => Promise<PaywallOutcome>;
  /**
   * Purchase a specific package from your own (custom) paywall UI. Resolves an
   * outcome so callers can tell a successful purchase from a cancel/failure.
   */
  purchasePackage: (pkg: PurchasesPackage) => Promise<PaywallOutcome>;
  /** Restore previous purchases. Resolves `true` if Pro is now active. */
  restore: () => Promise<boolean>;
  /** Present the RevenueCat Customer Center (manage/cancel/refund/support). */
  presentCustomerCenter: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const [configured, setConfigured] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [offeringsStatus, setOfferingsStatus] = useState<OfferingsStatus>('loading');

  // Fetch the current offering with a bounded retry — StoreKit product loads can
  // be slow or transient right after install. Treats "no packages" as an error
  // so the paywall can show a retry instead of hanging on "Loading plans…".
  const refreshOfferings = useCallback(async () => {
    if (!Purchases || typeof Purchases.getOfferings !== 'function') {
      setOfferingsStatus('error');
      return;
    }
    setOfferingsStatus('loading');
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const offs = await Purchases.getOfferings();
        setOfferings(offs);
        const hasPackages = (offs.current?.availablePackages?.length ?? 0) > 0;
        // TEMP DIAGNOSTIC: when the offering has no packages, probe the raw
        // products directly so the logs show whether StoreKit can see them at
        // all (vs. an offering/package wiring problem). Remove once resolved.
        if (!hasPackages) {
          try {
            const probe = await Purchases.getProducts(['YearlySub', 'Monthly']);
            console.log(
              '[RevenueCat] product probe →',
              'current offering:', offs.current?.identifier ?? '(none set as Current)',
              '| all offerings:', Object.keys(offs.all ?? {}),
              '| StoreKit returned products:', probe.map((p) => p.identifier),
            );
          } catch (probeErr) {
            console.log('[RevenueCat] product probe failed', probeErr);
          }
        }
        setOfferingsStatus(hasPackages ? 'loaded' : 'error');
        return;
      } catch (err) {
        if (attempt === maxAttempts) {
          console.warn('[RevenueCat] getOfferings failed', err);
          setOfferingsStatus('error');
          return;
        }
        await new Promise((r) => setTimeout(r, attempt * 600));
      }
    }
  }, []);

  // --- Configure the SDK once, and subscribe to customer-info updates ---
  useEffect(() => {
    if (configured) return;
    if (!API_KEY) {
      console.warn(
        '[RevenueCat] EXPO_PUBLIC_REVENUECAT_API_KEY is not set — subscriptions disabled.',
      );
      setOfferingsStatus('error');
      setIsReady(true);
      return;
    }

    // The native module is null when running in Expo Go, before the dev client
    // is rebuilt, or transiently after a Fast Refresh. Guard so we fail cleanly
    // (one warning) instead of throwing "Cannot read property … of null".
    if (!Purchases || typeof Purchases.configure !== 'function') {
      console.warn(
        '[RevenueCat] native module unavailable — subscriptions disabled. ' +
          'Cold-restart the app (fully quit & relaunch), or rebuild the dev client.',
      );
      setOfferingsStatus('error');
      setIsReady(true);
      return;
    }

    let listener: ((info: CustomerInfo) => void) | null = null;
    try {
      // TEMP DIAGNOSTIC: VERBOSE to see the exact product identifiers StoreKit
      // requests and which come back "invalid". Revert to WARN once resolved.
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
      Purchases.configure({ apiKey: API_KEY });
      setConfigured(true);

      // Keep entitlement state live (renewals, purchases on other devices, etc.).
      listener = (info: CustomerInfo) => setCustomerInfo(info);
      Purchases.addCustomerInfoUpdateListener(listener);

      (async () => {
        try {
          setCustomerInfo(await Purchases.getCustomerInfo());
        } catch (err) {
          console.warn('[RevenueCat] initialization error', err);
        } finally {
          setIsReady(true);
        }
      })();
      // Load offerings independently (own retry + status) so a slow/empty
      // product fetch never blocks entitlement readiness.
      void refreshOfferings();
    } catch (err) {
      // The native module isn't available (e.g. Expo Go, or the dev client
      // wasn't rebuilt after installing react-native-purchases). Don't crash
      // the app — just run without subscription features until a rebuild.
      console.warn(
        '[RevenueCat] native module unavailable — subscriptions disabled. ' +
          'Rebuild your development client to enable them.',
        err,
      );
      setOfferingsStatus('error');
      setIsReady(true);
    }

    return () => {
      if (listener) {
        try {
          Purchases.removeCustomerInfoUpdateListener(listener);
        } catch {
          // no-op
        }
      }
    };
  }, [configured, refreshOfferings]);

  // --- Identify the customer with their Clerk id so entitlements follow the
  // account across devices/reinstalls (not the anonymous per-device id). ---
  useEffect(() => {
    if (!configured || !isLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        if (userId) {
          const { customerInfo: info } = await Purchases.logIn(userId);
          if (!cancelled) {
            setCustomerInfo(info);
            // Offerings can be scoped to the identified user (targeting/
            // experiments), so re-fetch now that we've logged in.
            void refreshOfferings();
          }
        } else {
          // Only log out a previously-identified user. Calling logOut while the
          // SDK is still on its anonymous id throws / logs a native error.
          const currentId = await Purchases.getAppUserID();
          if (currentId && !currentId.startsWith('$RCAnonymousID')) {
            const info = await Purchases.logOut();
            if (!cancelled) setCustomerInfo(info);
          }
        }
      } catch (err) {
        console.warn('[RevenueCat] identity sync error', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, isLoaded, userId, refreshOfferings]);

  const refresh = useCallback(async () => {
    if (!API_KEY) return;
    try {
      setCustomerInfo(await Purchases.getCustomerInfo());
    } catch (err) {
      console.warn('[RevenueCat] refresh error', err);
    }
  }, []);

  const presentPaywall = useCallback(async () => {
    try {
      const result = await RevenueCatUI.presentPaywall();
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED ||
        hasPro(info)
      );
    } catch (err) {
      console.warn('[RevenueCat] presentPaywall error', err);
      return false;
    }
  }, []);

  const presentPaywallIfNeeded = useCallback(async (): Promise<PaywallOutcome> => {
    if (!configured) {
      console.warn(
        '[RevenueCat] paywall requested but the SDK is not configured (native module missing or not rebuilt).',
      );
      return { entitled: false, result: 'UNAVAILABLE' };
    }
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: PRO_ENTITLEMENT,
      });
      console.log('[RevenueCat] presentPaywallIfNeeded ->', result);

      if (result === PAYWALL_RESULT.ERROR) {
        // Almost always: no published paywall on the current offering. Log what
        // the SDK actually sees so the cause is unambiguous.
        try {
          const offs = await Purchases.getOfferings();
          const current = offs.current as (typeof offs.current & {
            paywall?: unknown;
            paywallComponents?: unknown;
          }) | null;
          console.warn(
            '[RevenueCat] Paywall ERROR diagnostics —',
            '\n  current offering:', current?.identifier ?? '(NONE set as Current)',
            '\n  packages:', current?.availablePackages?.map((p) => p.identifier) ?? [],
            '\n  paywall attached:', !!(current?.paywall || current?.paywallComponents),
          );
        } catch (diagErr) {
          console.warn('[RevenueCat] Paywall ERROR diagnostics failed', diagErr);
        }
      }

      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      // Verify against the actual customer info rather than trusting
      // NOT_PRESENTED, so a missing paywall can never look like "entitled".
      const entitled =
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED ||
        hasPro(info);
      return { entitled, result };
    } catch (err) {
      console.warn('[RevenueCat] presentPaywallIfNeeded error', err);
      return { entitled: false, result: 'ERROR' };
    }
  }, [configured]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<PaywallOutcome> => {
      if (!configured) {
        console.warn('[RevenueCat] purchase requested but the SDK is not configured.');
        return {
          entitled: false,
          result: 'UNAVAILABLE',
          message: "Subscriptions aren't available right now. Please try again later.",
        };
      }
      try {
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        setCustomerInfo(info);
        return { entitled: hasPro(info), result: PAYWALL_RESULT.PURCHASED };
      } catch (err) {
        // The SDK sets `userCancelled` when the customer dismisses the sheet.
        if ((err as { userCancelled?: boolean })?.userCancelled) {
          return { entitled: false, result: PAYWALL_RESULT.CANCELLED };
        }
        console.warn('[RevenueCat] purchasePackage error', err);
        return { entitled: false, result: 'ERROR', message: friendlyPurchaseError(err) };
      }
    },
    [configured],
  );

  const restore = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return hasPro(info);
    } catch (err) {
      console.warn('[RevenueCat] restore error', err);
      return false;
    }
  }, []);

  const presentCustomerCenter = useCallback(async () => {
    try {
      await RevenueCatUI.presentCustomerCenter();
      await refresh();
    } catch (err) {
      console.warn('[RevenueCat] presentCustomerCenter error', err);
    }
  }, [refresh]);

  const value: RevenueCatContextValue = {
    isReady,
    isPro: hasPro(customerInfo),
    customerInfo,
    offerings,
    offeringsStatus,
    refreshOfferings,
    refresh,
    presentPaywall,
    presentPaywallIfNeeded,
    purchasePackage,
    restore,
    presentCustomerCenter,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat(): RevenueCatContextValue {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return ctx;
}
