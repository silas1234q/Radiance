/**
 * Local notification scheduler.
 *
 * `reconcileLocalNotifications` is the single source of truth: it cancels every
 * previously-scheduled local reminder and re-schedules from the current
 * settings + routines + gamification state. It's idempotent, so it's safe to
 * call on every app foreground and whenever the underlying data changes.
 *
 * Two flavours of trigger are used:
 *   - Routine reminders repeat DAILY (they always apply).
 *   - The evening "log / streak" nudge is scheduled as one-shot DATE triggers
 *     for the next few days, so today's can be skipped once the day is a "full
 *     day" and the copy can adapt to whether a streak is at risk.
 */
import { Platform } from 'react-native';
import type * as NotificationsTypes from 'expo-notifications';
import type { GamificationSummary, Routine } from '../../types/api';
import { notificationsModule as Notifications } from './native';
import { getRemindersChannelId, ensureAndroidChannel } from './handler';
import { hasNotificationPermission } from './permissions';
import { NotificationSettings, parseTime } from './settings';

/** How many days ahead to pre-schedule the conditional evening nudge. */
const NUDGE_LOOKAHEAD_DAYS = 3;

export interface ReconcileInput {
  settings: NotificationSettings;
  routines: Routine[];
  gamification?: Pick<GamificationSummary, 'currentStreak'> | null;
  /** Today's full-day status; when true today's nudge is skipped. */
  todayIsFullDay?: boolean;
}

function androidChannel() {
  return Platform.OS === 'android'
    ? { channelId: getRemindersChannelId() }
    : {};
}

function dailyTrigger(
  time: string,
): NotificationsTypes.NotificationTriggerInput {
  const { hour, minute } = parseTime(time);
  return {
    type: Notifications!.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
    ...androidChannel(),
  };
}

/** A Date at `time` on today+offsetDays, or null if that moment is in the past. */
function dateAtOffset(time: string, offsetDays: number): Date | null {
  const { hour, minute } = parseTime(time);
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.getTime() > Date.now() + 1000 ? d : null;
}

async function schedule(
  content: NotificationsTypes.NotificationContentInput,
  trigger: NotificationsTypes.NotificationTriggerInput,
): Promise<void> {
  await Notifications!.scheduleNotificationAsync({
    content,
    trigger,
  });
}

/**
 * Cancel all locally-scheduled reminders and reschedule from current state.
 * No-op (after cancelling) if permission isn't granted or the master switch is
 * off, which also serves to clear everything when the user opts out.
 */
export async function reconcileLocalNotifications(
  input: ReconcileInput,
): Promise<void> {
  if (!Notifications) return;
  const { settings, routines, gamification, todayIsFullDay } = input;

  // The app schedules no other local notifications, so a full cancel is the
  // simplest way to stay idempotent and avoid duplicates.
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.pushNotifications) return;
  if (!(await hasNotificationPermission())) return;

  // Ensure the Android channel exists before scheduling.
  await ensureAndroidChannel();

  // ── Routine reminders (daily, unconditional) ──
  if (settings.routineReminders) {
    const active = routines.filter((r) => r.isActive !== false);

    const am = active.find((r) => r.type === 'AM');
    if (am && am.steps.length > 0) {
      await schedule(
        {
          title: 'Morning glow',
          body: 'Time for your AM skincare routine.',
          data: { route: '/(tabs)/routine' },
        },
        dailyTrigger(am.amReminderTime ?? settings.amTime),
      );
    }

    const pm = active.find((r) => r.type === 'PM');
    if (pm && pm.steps.length > 0) {
      await schedule(
        {
          title: 'Evening wind-down',
          body: 'Your PM skincare routine is waiting.',
          data: { route: '/(tabs)/routine' },
        },
        dailyTrigger(pm.pmReminderTime ?? settings.pmTime),
      );
    }

    // Custom routines opt in explicitly at creation and carry their own times.
    for (const routine of active) {
      if (routine.type !== 'CUSTOM' || !routine.reminderEnabled) continue;
      const label = routine.name?.trim() || 'your routine';
      if (routine.amReminderTime) {
        await schedule(
          {
            title: `Reminder: ${label}`,
            body: `Time for ${label}.`,
            data: { route: '/(tabs)/routine' },
          },
          dailyTrigger(routine.amReminderTime),
        );
      }
      if (routine.pmReminderTime) {
        await schedule(
          {
            title: `Reminder: ${label}`,
            body: `Time for ${label}.`,
            data: { route: '/(tabs)/routine' },
          },
          dailyTrigger(routine.pmReminderTime),
        );
      }
    }
  }

  // ── Evening daily-log / streak-protection nudge (conditional, one-shot) ──
  const streak = gamification?.currentStreak ?? 0;
  const streakActive = settings.streakProtection && streak > 0;
  const wantsNudge = settings.dailyLog || streakActive;

  if (wantsNudge) {
    for (let offset = 0; offset < NUDGE_LOOKAHEAD_DAYS; offset++) {
      // Skip today entirely once the day is already complete.
      if (offset === 0 && todayIsFullDay) continue;

      const when = dateAtOffset(settings.logTime, offset);
      if (!when) continue;

      // Streak copy wins when a streak is genuinely at risk; otherwise the
      // gentler daily-log copy (only if that toggle is on).
      let content: NotificationsTypes.NotificationContentInput | null = null;
      if (streakActive) {
        content = {
          title: `Keep your ${streak}-day streak`,
          body: 'Finish your routine and log today so your streak stays alive.',
          data: { route: '/skin-log-modal' },
        };
      } else if (settings.dailyLog) {
        content = {
          title: "How's your skin today?",
          body: 'Log your mood and skin to complete today.',
          data: { route: '/skin-log-modal' },
        };
      }
      if (!content) continue;

      await schedule(
        content,
        {
          type: Notifications!.SchedulableTriggerInputTypes.DATE,
          date: when,
          ...androidChannel(),
        },
      );
    }
  }
}

/** Cancel everything — used when the user turns notifications fully off. */
export async function cancelAllLocalNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
