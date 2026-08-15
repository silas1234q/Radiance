import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { PACKAGE_TYPE, type PurchasesPackage } from 'react-native-purchases';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { useRevenueCat } from '../../providers/RevenueCatProvider';
import { useTrack } from '../../hooks/useTrack';
import LegalModal, { type LegalDoc } from '../legal/LegalModal';
import { toast } from '../../lib/toast';

const BENEFITS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}[] = [
  { icon: 'analytics-outline', title: 'Full skin analysis', subtitle: 'Score, metrics & face map' },
  { icon: 'sparkles-outline', title: 'Personalized routine', subtitle: 'AM & PM steps for your skin' },
  { icon: 'flask-outline', title: 'Product matches', subtitle: 'Ingredients that fit you' },
  { icon: 'trending-up-outline', title: 'Progress tracking', subtitle: 'Watch your skin improve' },
];

type PlanId = 'yearly' | 'monthly' | 'weekly';

interface DisplayPlan {
  id: PlanId;
  name: string;
  pkg: PurchasesPackage;
  price: string; // localized total price (e.g. "$59.99")
  perMonth: string; // e.g. "$5.00 / mo"
  billedNote: string;
  badge?: string;
}

function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

/**
 * Build the plan tiles from the current RevenueCat offering's packages so the
 * prices shown always match what the customer is actually charged.
 */
function buildPlans(pkgs: PurchasesPackage[]): DisplayPlan[] {
  // Prefer RevenueCat's standard package types; fall back to matching the
  // product identifier by keyword so any naming works (e.g. "YearlySub",
  // "Monthly") without relying on the exact Annual/Monthly package slots.
  const matches = (p: PurchasesPackage, type: PACKAGE_TYPE, ...needles: string[]) => {
    if (p.packageType === type) return true;
    const id = p.product.identifier.toLowerCase();
    return needles.some((n) => id.includes(n));
  };
  const annual = pkgs.find((p) => matches(p, PACKAGE_TYPE.ANNUAL, 'year', 'annual'));
  const monthly = pkgs.find((p) => matches(p, PACKAGE_TYPE.MONTHLY, 'month'));
  const weekly = pkgs.find((p) => matches(p, PACKAGE_TYPE.WEEKLY, 'week'));

  const plans: DisplayPlan[] = [];

  if (annual) {
    const perMo = annual.product.price / 12;
    // Compare against the cheapest shorter-period option for a meaningful badge.
    const refMonthly = monthly?.product.price ?? (weekly ? weekly.product.price * 4.33 : 0);
    let badge: string | undefined;
    if (refMonthly > 0) {
      const pct = Math.round((1 - perMo / refMonthly) * 100);
      if (pct > 0) badge = `SAVE ${pct}%`;
    }
    plans.push({
      id: 'yearly',
      name: 'Yearly',
      pkg: annual,
      price: annual.product.priceString,
      perMonth: `${formatMoney(perMo, annual.product.currencyCode)} / mo`,
      billedNote: 'billed yearly',
      badge,
    });
  }
  if (monthly) {
    plans.push({
      id: 'monthly',
      name: 'Monthly',
      pkg: monthly,
      price: monthly.product.priceString,
      perMonth: `${monthly.product.priceString} / mo`,
      billedNote: 'billed monthly',
    });
  }
  if (weekly) {
    const perMo = weekly.product.price * 4.33;
    plans.push({
      id: 'weekly',
      name: 'Weekly',
      pkg: weekly,
      price: weekly.product.priceString,
      perMonth: `~${formatMoney(perMo, weekly.product.currencyCode)} / mo`,
      billedNote: 'billed weekly',
    });
  }
  return plans;
}

/**
 * Premium bottom-sheet paywall shown over the blurred results. Tiles are bound
 * to real RevenueCat packages; tapping the CTA hands the selected package up to
 * `onSubscribe` to purchase and unlock.
 */
export default function SubscribeGate({
  onSubscribe,
  onSkip,
  loading,
}: {
  onSubscribe: (pkg: PurchasesPackage) => void;
  onSkip: () => void;
  loading: boolean;
}) {
  const insets = useSafeAreaInsets();
  const track = useTrack();
  const { offerings, offeringsStatus, refreshOfferings, restore } = useRevenueCat();
  const plans = useMemo(
    () => buildPlans(offerings?.current?.availablePackages ?? []),
    [offerings],
  );
  const [selected, setSelected] = useState<PlanId>(plans[0]?.id ?? 'yearly');
  const plan = plans.find((p) => p.id === selected) ?? plans[0];
  const [restoring, setRestoring] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

  // Impression fires once the offering resolves, not on mount: the sheet renders
  // first with zero plans and a "Loading plans…" CTA, and counting that as a
  // paywall view would make the tap-through rate look far worse than it is.
  // `plan_count: 0` with a settled status is the genuine "plans failed to load"
  // case, which is worth seeing.
  const viewTracked = useRef(false);
  useEffect(() => {
    if (viewTracked.current || offeringsStatus === 'loading') return;
    viewTracked.current = true;
    track('onboarding_paywall_viewed', {
      plan_count: plans.length,
      offerings_status: offeringsStatus,
    });
  }, [offeringsStatus, plans.length, track]);

  const handleRestore = async () => {
    if (restoring || loading) return;
    setRestoring(true);
    track('onboarding_paywall_restore_tapped');
    try {
      const outcome = await restore();
      track('onboarding_paywall_restore_completed', { status: outcome.status });
      // On success we say nothing on purpose: `isPro` flips, the paywall is
      // replaced by the unlocked results, and that *is* the feedback. An alert
      // here would just be a tap in front of what they came for.
      if (outcome.status === 'nothing-to-restore') {
        toast.info('No previous purchase found for your App Store account.', {
          title: 'Nothing to restore',
        });
      } else if (outcome.status === 'error') {
        toast.error(outcome.message, { title: "Couldn't restore" });
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleRetry = async () => {
    if (retrying || loading) return;
    setRetrying(true);
    track('onboarding_paywall_offerings_retried');
    try {
      await refreshOfferings();
    } finally {
      setRetrying(false);
    }
  };

  // Three-way CTA: buy the selected plan, wait while plans load, or retry when
  // the offering came back empty/failed (so it never hangs on "Loading plans…").
  const ctaMode: 'ready' | 'loading' | 'error' = plan
    ? 'ready'
    : offeringsStatus === 'loading' || retrying
      ? 'loading'
      : 'error';

  return (
    <Animated.View
      entering={SlideInDown.duration(320)}
      style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
    

      {/* Header — left aligned, brand mark inline */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          Unlock your{'\n'}
          <Text style={styles.titleAccent}>Radiance</Text> results
        </Text>
        <View style={styles.proPill}>
          <Ionicons name="sparkles" size={11} color={COLORS.primary} />
          <Text style={styles.proPillText}>PRO</Text>
        </View>
      </View>

      {/* Feature list */}
      <View style={styles.benefits}>
        {BENEFITS.map((b, i) => (
          <View key={b.title} style={[styles.benefitRow, i > 0 && styles.benefitDivider]}>
            <View style={styles.benefitIcon}>
              <Ionicons name={b.icon} size={17} color={COLORS.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitSubtitle}>{b.subtitle}</Text>
            </View>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          </View>
        ))}
      </View>

      {/* Plan selector */}
      <View style={styles.plans}>
        {plans.map((p, i) => {
          const isSelected = p.id === (plan?.id ?? selected);
          const isFullWidth = plans.length === 3 && i === 0;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                // Which tile people land on before buying (or before leaving) is
                // the pricing signal the purchase event alone can't give you.
                track('onboarding_paywall_plan_selected', { plan: p.id });
                setSelected(p.id);
              }}
              style={[
                styles.planTile,
                isSelected ? styles.planTileActive : styles.planTileInactive,
                isFullWidth && styles.planTileFull,
              ]}
            >
              {p.badge && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>{p.badge}</Text>
                </View>
              )}
              <Text style={[styles.planName, !isSelected && styles.planTextMuted]}>{p.name}</Text>
              <Text style={[styles.planPrice, !isSelected && styles.planTextMuted]}>{p.price}</Text>
              <Text style={[styles.planPerMonth, !isSelected && styles.planTextMuted]}>{p.perMonth}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Dynamic price summary + fine print */}
      {plan && (
        <Text style={styles.summary}>
          {plan.perMonth.replace(' / mo', ' per month')}, {plan.billedNote}.
        </Text>
      )}
      <Text style={styles.finePrint}>
        Auto-renews unless canceled at least 24 hours before renewal. Cancel anytime in Settings.
      </Text>

      {/* CTA */}
      <Pressable
        onPress={() => {
          if (loading) return;
          if (ctaMode === 'ready' && plan) onSubscribe(plan.pkg);
          else if (ctaMode === 'error') handleRetry();
        }}
        disabled={loading || ctaMode === 'loading'}
        style={({ pressed }) => [
          styles.ctaWrap,
          pressed && !loading && ctaMode !== 'loading' && { transform: [{ scale: 0.985 }] },
          ctaMode === 'loading' && { opacity: 0.6 },
        ]}
      >
        <LinearGradient
          colors={GRADIENTS.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          {loading || ctaMode === 'loading' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : ctaMode === 'error' ? (
            <>
              <Ionicons name="refresh" size={17} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.ctaText}>Couldn&apos;t load plans — Retry</Text>
            </>
          ) : (
            <>
              <Text style={styles.ctaText}>Get Radiance Pro</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </>
          )}
        </LinearGradient>
      </Pressable>

      {/* "Risk it" — skip the accurate scan analysis and fall back to the
          free, quiz-only OpenAI estimate. */}
      <Pressable onPress={onSkip} disabled={loading} hitSlop={8} style={styles.skip}>
        <Text style={styles.skipTitle}>Risk it — use the free estimate</Text>
        <Text style={styles.skipCaption}>
          Quiz-only analysis, without your scan. Less accurate than Radiance Pro.
        </Text>
      </Pressable>

      {/* Footer legal links */}
      <View style={styles.footer}>
        <Text
          style={styles.footerLink}
          onPress={() => setLegalDoc('terms')}
          suppressHighlighting
        >
          Terms of Service
        </Text>
        <Text style={styles.footerDot}>·</Text>
        <Text
          style={styles.footerLink}
          onPress={() => setLegalDoc('privacy')}
          suppressHighlighting
        >
          Privacy Policy
        </Text>
        <Text style={styles.footerDot}>·</Text>
        <Text style={styles.footerLink} onPress={handleRestore} suppressHighlighting>
          {restoring ? 'Restoring…' : 'Restore Purchase'}
        </Text>
      </View>
      </ScrollView>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 12,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginBottom: 18,
  },

  // Header
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    flex: 1,
    fontSize: 25,
    lineHeight: 31,
    fontFamily: 'SFProRounded_Bold',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  titleAccent: { color: COLORS.primary },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    marginTop: 2,
  },
  proPillText: {
    fontSize: 10.5,
    fontFamily: 'SFProRounded_Bold',
    color: COLORS.primaryDark,
    letterSpacing: 1,
  },

  // Benefits
  benefits: {
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  benefitDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 14.5,
    fontFamily: 'SFProRounded_Semibold',
    color: COLORS.text,
  },
  benefitSubtitle: {
    fontSize: 12.5,
    fontFamily: 'SFProRounded_Regular',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Plans
  plans: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  planTile: {
    flex: 1,
    minWidth: '40%' as unknown as number,
    borderRadius: 18,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
  },
  planTileFull: {
    flex: undefined,
    width: '100%' as unknown as number,
  },
  planTileActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF7F9',
  },
  planTileInactive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  planTextMuted: { color: COLORS.textSecondary },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  saveBadgeText: {
    fontSize: 10,
    fontFamily: 'SFProRounded_Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 13,
    fontFamily: 'SFProRounded_Medium',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 22,
    fontFamily: 'SFProRounded_Bold',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  planPerMonth: {
    fontSize: 12.5,
    fontFamily: 'SFProRounded_Medium',
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Summary + fine print
  summary: {
    fontSize: 14.5,
    fontFamily: 'SFProRounded_Semibold',
    color: COLORS.text,
    textAlign: 'center',
  },
  finePrint: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: 'SFProRounded_Regular',
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 6,
  },

  // CTA
  ctaWrap: {
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cta: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16.5,
    fontFamily: 'SFProRounded_Semibold',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // "Risk it" skip
  skip: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 2,
  },
  skipTitle: {
    fontSize: 14,
    fontFamily: 'SFProRounded_Semibold',
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  skipCaption: {
    fontSize: 12,
    fontFamily: 'SFProRounded_Regular',
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 3,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: 'SFProRounded_Medium',
    color: COLORS.textTertiary,
  },
  footerDot: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
