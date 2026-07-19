import { View, ScrollView } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Skeleton from '../ui/Skeleton';
import ScreenBackground from '../ui/ScreenBackground';

const GLASS_CARD = {
  backgroundColor: 'rgba(255,255,255,0.3)',
  borderRadius: 22,
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.4)',
  padding: 16,
  marginBottom: 16,
};

const SKELETON_COLORS = {
  boneColor: 'rgba(255,255,255,0.35)',
  highlightColor: 'rgba(255,255,255,0.55)',
};

export default function DashboardSkeleton() {
  return (
    <ScreenBackground>
      <Animated.View exiting={FadeOut.duration(300)} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <View className="mt-2 mb-5 gap-2">
            <Skeleton width={220} height={28} borderRadius={8} />
          </View>

          {/* Skin Score Card */}
          <View style={GLASS_CARD}>
            <View className="flex-row items-center gap-4">
              <Skeleton width={90} height={90} borderRadius={45} />
              <View className="flex-1 gap-3">
                <Skeleton width={120} height={16} borderRadius={8} />
                <Skeleton width={80} height={12} borderRadius={6} />
                <Skeleton width={100} height={32} borderRadius={16} />
              </View>
            </View>
          </View>

          {/* Forecast Card */}
          <View style={GLASS_CARD}>
            <View className="gap-3">
              <Skeleton width={140} height={14} borderRadius={7} />
              <Skeleton width="100%" height={12} borderRadius={6} />
              <Skeleton width="85%" height={12} borderRadius={6} />
            </View>
          </View>

          {/* Routine Progress Card */}
          <View style={GLASS_CARD}>
            <View className="gap-3">
              <Skeleton width={160} height={14} borderRadius={7} />
              <Skeleton width="100%" height={8} borderRadius={4} />
              <Skeleton width={90} height={12} borderRadius={6} />
            </View>
          </View>

          {/* Mood Tracker */}
          <View style={GLASS_CARD}>
            <View className="gap-3">
              <Skeleton width={130} height={14} borderRadius={7} />
              <View className="flex-row justify-between">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} width={44} height={44} borderRadius={22} />
                ))}
              </View>
            </View>
          </View>

          {/* Product Carousel */}
          <View className="gap-3">
            <Skeleton width={100} height={14} borderRadius={7} />
            <View className="flex-row gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width={130} height={170} borderRadius={18} />
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </ScreenBackground>
  );
}
