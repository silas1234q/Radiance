import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../ui/GlassCard';
import FaceIcon from './FaceIcon';
import { COLORS } from '../../constants/theme';
import { useTodaySkinLog } from '../../hooks/queries/useSkinLogs';

const MOODS = [
  { label: 'Bad', value: 'Bad', color: '#FF3B30' },
  { label: 'Not great', value: 'Meh', color: '#FF9500' },
  { label: 'Okay', value: 'Okay', color: '#FFCC00' },
  { label: 'Good', value: 'Good', color: '#34C759' },
  { label: 'Awesome', value: 'Great', color: '#30D158' },
] as const;

export default function SkinDiaryCard() {
  const router = useRouter();
  const { data: todayLog } = useTodaySkinLog();
  const [showMoods, setShowMoods] = React.useState(false);
  const lastLogMood = React.useRef(todayLog?.mood);

  // Reset showMoods when the log's mood changes (user re-logged)
  React.useEffect(() => {
    if (todayLog?.mood && todayLog.mood !== lastLogMood.current) {
      setShowMoods(false);
    }
    lastLogMood.current = todayLog?.mood;
  }, [todayLog?.mood]);

  const isDone = !!todayLog && !showMoods;
  const loggedMood = todayLog?.mood;
  const moodEntry = MOODS.find((m) => m.value === loggedMood);

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      {/* Header row */}
      <View className="flex-row items-center mb-5 gap-3">
        <Pressable
          onPress={() => {
            if (todayLog) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowMoods((prev) => !prev);
            }
          }}
          hitSlop={8}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: todayLog ? COLORS.success : COLORS.textTertiary,
            backgroundColor: todayLog ? COLORS.success : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!!todayLog && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </Pressable>
        <Text className="text-[16px] font-poppins-semibold text-skin-text" style={{ flex: 1 }}>
          {isDone ? 'Skin diary logged' : 'How does your skin feel today?'}
        </Text>
        {isDone && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowMoods(true);
            }}
            hitSlop={8}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      {isDone ? (
        <View
          className="flex-row items-center gap-3"
          style={{
            backgroundColor: 'rgba(52,199,89,0.08)',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          {moodEntry && <FaceIcon mood={moodEntry.label} size={36} selected noBackground />}
          <View style={{ flex: 1 }}>
            <Text className="text-[14px] font-poppins-medium text-skin-text">
              Feeling {moodEntry?.label ?? loggedMood}
            </Text>
            <Text className="text-[12px] font-poppins-regular" style={{ color: COLORS.textSecondary }}>
              Today's diary complete
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        </View>
      ) : (
        <View className="flex-row justify-between">
          {MOODS.map(({ label, value }) => (
            <Pressable
              key={value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/skin-log-modal', params: { mood: value } });
              }}
              className="items-center"
              style={{ flex: 1 }}
            >
              <FaceIcon mood={label} />
              <Text
                className="text-[11px] font-poppins-medium mt-2"
                style={{ color: COLORS.textSecondary }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </GlassCard>
  );
}
