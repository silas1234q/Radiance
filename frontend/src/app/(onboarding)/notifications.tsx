import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { requestNotificationPermission } from '../../lib/notifications';

const PERKS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'sunny-outline',
    title: 'Routine reminders',
    body: 'A gentle nudge for your AM and PM skincare.',
  },
  {
    icon: 'flame-outline',
    title: 'Keep your streak',
    body: "We'll remind you before your streak is at risk.",
  },
  {
    icon: 'sparkles-outline',
    title: 'Weekly progress',
    body: 'See how your skin is improving each week.',
  },
];

export default function NotificationsOptInScreen() {
  const router = useRouter();
  const { setMany } = useNotificationSettings();
  const [busy, setBusy] = useState(false);

  const finish = useCallback(() => router.replace('/(tabs)'), [router]);

  const handleEnable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const granted = await requestNotificationPermission();
      // Enable the reminder set regardless — if permission was denied the user
      // can grant it later in Settings and reminders start working immediately.
      setMany({
        pushNotifications: granted,
        routineReminders: true,
        dailyLog: true,
        streakProtection: true,
        weeklyProgress: true,
      });
    } finally {
      finish();
    }
  }, [busy, setMany, finish]);

  const handleSkip = useCallback(() => {
    // Explicit opt-out; the user can re-enable from App Settings later.
    setMany({ pushNotifications: false });
    finish();
  }, [setMany, finish]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
          <Animated.View entering={FadeIn.duration(400)}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: COLORS.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Ionicons name="notifications" size={34} color={COLORS.primary} />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'SFProRounded_Bold',
                color: COLORS.text,
                marginBottom: 10,
              }}
            >
              Stay on track
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'SFProRounded_Regular',
                color: COLORS.textSecondary,
                lineHeight: 22,
                marginBottom: 32,
              }}
            >
              Turn on reminders so you never miss a routine — the best skin comes
              from consistency.
            </Text>
          </Animated.View>

          {PERKS.map((perk, i) => (
            <Animated.View
              key={perk.title}
              entering={FadeInDown.delay(120 * i + 150).duration(450)}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: COLORS.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name={perk.icon} size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'SFProRounded_Semibold',
                    color: COLORS.text,
                  }}
                >
                  {perk.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'SFProRounded_Regular',
                    color: COLORS.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {perk.body}
                </Text>
              </View>
            </Animated.View>
          ))}

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={handleEnable}
            disabled={busy}
            style={({ pressed }) => [
              {
                height: 56,
                borderRadius: 16,
                backgroundColor: COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'SFProRounded_Semibold',
                color: '#fff',
                letterSpacing: 0.3,
              }}
            >
              {busy ? 'Setting up…' : 'Enable reminders'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSkip}
            disabled={busy}
            style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'SFProRounded_Medium',
                color: COLORS.textSecondary,
              }}
            >
              Not now
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
