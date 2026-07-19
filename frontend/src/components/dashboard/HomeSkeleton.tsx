import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeOut } from 'react-native-reanimated';
import Skeleton from '../ui/Skeleton';

const CARD = {
  backgroundColor: '#fff',
  borderRadius: 20,
  padding: 16,
  marginBottom: 16,
} as const;

export default function HomeSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <Animated.View
          exiting={FadeOut.duration(300)}
          style={{ flex: 1, paddingHorizontal: 20 }}
        >
          {/* Header row: "Home" + GoalChip */}
          <View className="flex-row items-center justify-between mt-2">
            <Skeleton width={90} height={32} borderRadius={8} />
            <Skeleton width={90} height={28} borderRadius={14} />
          </View>

          {/* Search bar */}
          <View style={{ marginTop: 12, marginBottom: 20 }}>
            <Skeleton width="100%" height={44} borderRadius={14} />
          </View>

          {/* Greeting */}
          <View style={{ marginBottom: 20 }}>
            <Skeleton width={220} height={24} borderRadius={8} />
          </View>

          {/* Streak & XP Card */}
          <View style={[CARD, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
            <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
              <Skeleton width={28} height={28} borderRadius={14} />
              <Skeleton width={36} height={28} borderRadius={8} />
              <Skeleton width={60} height={10} borderRadius={5} />
            </View>
            <View style={{ width: 1, height: 50, backgroundColor: '#F0F0F0' }} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width={80} height={12} borderRadius={6} />
              <Skeleton width={120} height={18} borderRadius={8} />
              <Skeleton width="100%" height={5} borderRadius={3} />
              <Skeleton width={100} height={10} borderRadius={5} />
            </View>
          </View>

          {/* Routine Compatibility Card */}
          <View style={CARD}>
            <View style={{ gap: 12 }}>
              <Skeleton width={180} height={16} borderRadius={8} />
              <Skeleton width="100%" height={8} borderRadius={4} />
              <View className="flex-row gap-3">
                <Skeleton width={100} height={12} borderRadius={6} />
                <Skeleton width={100} height={12} borderRadius={6} />
              </View>
            </View>
          </View>

          {/* Section label: Skin Diary */}
          <View style={{ marginBottom: 12 }}>
            <Skeleton width={90} height={14} borderRadius={7} />
          </View>

          {/* Skin Diary Card */}
          <View style={CARD}>
            <View className="flex-row items-center gap-3 mb-3">
              <Skeleton width={40} height={40} borderRadius={12} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width={140} height={14} borderRadius={7} />
                <Skeleton width={100} height={10} borderRadius={5} />
              </View>
            </View>
            <Skeleton width="100%" height={44} borderRadius={12} />
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
