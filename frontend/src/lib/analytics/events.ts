/**
 * Analytics event catalogue.
 *
 * Every `track()` call goes through the types below, so an event-name typo is a
 * compile error rather than a silently-orphaned event in PostHog. Adding an
 * event means adding a line to `AnalyticsEventProps` — the union derives from
 * it, so names and payloads can't drift apart.
 *
 * **PII rule for this app:** no quiz *answers*, no photo URIs, no free text, no
 * product ingredient lists. Radiance collects health-adjacent data (skin
 * concerns, pregnancy status via the female-only questions) and photos of the
 * user's face. *Which* question someone was on when they quit is what funnel
 * analysis needs; *what they answered* is not, and isn't worth handing to a
 * third party to find out. Counts, ids, durations, and closed-set outcomes only.
 *
 * Sessions and retention don't need custom events: the PostHog RN SDK stamps
 * `$session_id` on everything and emits `Application Installed`, `Application
 * Updated`, `Application Opened`, `Application Became Active` and `Application
 * Backgrounded` on its own (see `AnalyticsProvider`). Screen views come from
 * `AnalyticsTracker`. So "where did they drop off after installing" is
 * `Application Installed` → the auth and onboarding events below, and "what do
 * they use" is the feature events, both sliced by session.
 */

/** Which analysis ran behind the paywall. */
export type AnalysisSource = 'scan' | 'quiz_only';

/** What caused the analysis to run. */
export type AnalysisTrigger = 'purchase' | 'auto_unlock' | 'skip';

/** Where a routine/mood/scan action was initiated from. */
export type SurfaceName = 'dashboard' | 'routine' | 'progress' | 'profile' | 'scan' | 'other';

export type AnalyticsEventProps = {
  // ===== Activation: install → signed in =====
  /** First screen after install for a signed-out user. */
  auth_viewed: void;
  auth_started: { provider: 'apple' | 'google' };
  auth_succeeded: { provider: 'apple' | 'google'; is_returning: boolean };
  /** The SSO sheet closed without producing a session — usually a user cancel. */
  auth_dismissed: { provider: 'apple' | 'google' };
  auth_failed: { provider: 'apple' | 'google'; code: string };
  /**
   * Native Sign in with Apple failed and we retried through the web SSO flow.
   * Should be ~zero — a steady trickle means this build's bundle ID isn't
   * registered on Clerk's Native applications page.
   */
  auth_fallback_used: { provider: 'apple' | 'google' };
  auth_legal_opened: { doc: string };

  // ===== Onboarding: quiz =====
  onboarding_quiz_started: { total_questions: number };
  onboarding_quiz_question_viewed: {
    question_id: number;
    question_index: number;
    total_questions: number;
    question_type: string;
  };
  onboarding_quiz_question_skipped: { question_id: number; question_index: number };
  onboarding_quiz_submitted: { answered_count: number; total_questions: number };
  onboarding_quiz_submit_failed: { message: string };

  // ===== Face scan =====
  // The scan screen is reached both from onboarding and from the dashboard for
  // repeat scans, so these are NOT prefixed `onboarding_` — labelling a
  // month-old user's re-scan as onboarding would quietly corrupt the funnel.
  // Filter on `is_onboarding` for the activation funnel; leave it off to measure
  // scanning as an ongoing feature.
  scan_viewed: { permission_granted: boolean; is_onboarding: boolean };
  scan_permission_denied: { can_ask_again: boolean; is_onboarding: boolean };
  scan_skipped: { is_onboarding: boolean };
  scan_capture_started: { flash_on: boolean; is_onboarding: boolean };
  scan_captured: { flash_on: boolean; is_onboarding: boolean };
  /** Face validation rejected the photo, or the capture itself threw. */
  scan_capture_failed: { reason: string; flash_on: boolean; is_onboarding: boolean };
  scan_credit_prompt_viewed: {
    free_scans_remaining: number;
    available_credits: number;
    has_credit_package: boolean;
    is_onboarding: boolean;
  };
  scan_credit_purchase_started: void;
  scan_credit_purchased: void;
  scan_credit_purchase_failed: { message: string };
  /** The theatrical post-capture screen; `is_onboarding` isn't in scope there. */
  scan_processing_viewed: void;
  scan_processing_completed: { duration_ms: number };

  // ===== Onboarding: paywall =====
  onboarding_results_locked_viewed: { has_photo: boolean; is_pro: boolean };
  onboarding_paywall_viewed: { plan_count: number; offerings_status: string };
  onboarding_paywall_plan_selected: { plan: string };
  onboarding_paywall_subscribe_tapped: { plan: string; price: number; currency: string };
  onboarding_paywall_offerings_retried: void;
  onboarding_paywall_restore_tapped: void;
  onboarding_paywall_restore_completed: { status: string };
  /** "Risk it — use the free estimate". */
  onboarding_paywall_skipped: void;
  onboarding_purchase_succeeded: { plan: string };
  onboarding_purchase_cancelled: { plan: string };
  onboarding_purchase_failed: { plan: string; message: string };

  // ===== Onboarding: analysis + reveal =====
  onboarding_analysis_started: { source: AnalysisSource; trigger: AnalysisTrigger };
  onboarding_analysis_succeeded: {
    source: AnalysisSource;
    trigger: AnalysisTrigger;
    duration_ms: number;
  };
  onboarding_analysis_failed: {
    source: AnalysisSource;
    trigger: AnalysisTrigger;
    duration_ms: number;
    message: string;
    is_scan_error: boolean;
  };
  onboarding_results_viewed: {
    analysis_source: string;
    has_scan: boolean;
    skin_score: number;
    concern_count: number;
  };
  /** Terminal step: leaving onboarding for the app. */
  onboarding_completed: { had_error: boolean };

  // ===== Feature usage: routines =====
  routine_step_toggled: { routine_id: string };
  routine_completed: { routine_id: string };
  routine_created: { has_reminder: boolean };
  routine_updated: { routine_id: string; fields: string };
  routine_deleted: { routine_id: string };
  routine_step_added: { routine_id: string; has_product: boolean };
  routine_step_updated: { routine_id: string };
  routine_step_deleted: { routine_id: string };
  routine_steps_reordered: { routine_id: string; step_count: number };

  // ===== Feature usage: tracking =====
  mood_logged: void;
  skin_log_created: { factor_count: number; has_notes: boolean; has_photo: boolean };
  streak_restored: void;

  // ===== Feature usage: products =====
  product_barcode_scanned: void;
  product_barcode_lookup_failed: { message: string };
  product_created_manually: { category: string };
  product_ingredients_extracted: { ingredient_count: number };
  product_removed_from_shelf: void;
};

export type AnalyticsEvent = keyof AnalyticsEventProps;
