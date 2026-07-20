import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import CircularProgress from '../ui/CircularProgress';

interface ScanMetrics {
  acne: { rawScore: number; uiScore: number };
  wrinkle: { rawScore: number; uiScore: number };
  ageSpot: { rawScore: number; uiScore: number };
  redness: { rawScore: number; uiScore: number };
  pore: { rawScore: number; uiScore: number };
  oiliness: { rawScore: number; uiScore: number };
  texture: { rawScore: number; uiScore: number };
  moisture: { rawScore: number; uiScore: number };
}

interface ScanMetricExplanations {
  acne: string;
  wrinkle: string;
  ageSpot: string;
  redness: string;
  pore: string;
  oiliness: string;
  texture: string;
  moisture: string;
}

interface ScanMetricsCardProps {
  metrics: ScanMetrics;
  explanations?: ScanMetricExplanations | null;
}

type MetricKey = keyof ScanMetrics;

const METRIC_CONFIG: { key: MetricKey; label: string; color: string }[] = [
  { key: 'acne', label: 'Clarity', color: '#EF5350' },
  { key: 'wrinkle', label: 'Smoothness', color: '#AB47BC' },
  { key: 'ageSpot', label: 'Even Tone', color: '#8D6E63' },
  { key: 'redness', label: 'Calm', color: '#FF7043' },
  { key: 'pore', label: 'Pore Health', color: '#26A69A' },
  { key: 'oiliness', label: 'Oil Balance', color: '#FFA726' },
  { key: 'texture', label: 'Texture', color: '#66BB6A' },
  { key: 'moisture', label: 'Moisture', color: '#42A5F5' },
];

function ExpandableExplanation({ explanation, isExpanded }: { explanation: string; isExpanded: boolean }) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    height.value = withTiming(isExpanded ? 1 : 0, { duration: 250, easing: Easing.inOut(Easing.ease) });
    opacity.value = withTiming(isExpanded ? 1 : 0, { duration: 200 });
  }, [isExpanded]);

  const animStyle = useAnimatedStyle(() => ({
    maxHeight: height.value * 120,
    opacity: opacity.value,
    overflow: 'hidden' as const,
  }));

  return (
    <Animated.View style={animStyle}>
      <View className="px-4 pb-4 pt-1">
        <Text className="text-[13px] font-poppins-regular text-skin-text-secondary leading-[20px]">
          {explanation}
        </Text>
      </View>
    </Animated.View>
  );
}

function MetricItem({
  metricKey,
  label,
  color,
  score,
  explanation,
  isExpanded,
  onPress,
}: {
  metricKey: MetricKey;
  label: string;
  color: string;
  score: number;
  explanation?: string;
  isExpanded: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ width: '33.33%' }}>
      <Pressable
        onPress={explanation ? onPress : undefined}
        className="items-center py-2"
        style={({ pressed }) => [pressed && explanation ? { opacity: 0.7 } : {}]}
      >
        <CircularProgress score={score} size={68} strokeWidth={4.5} color={color} />
        <Text
          className="text-[10px] font-poppins-medium text-skin-text-secondary mt-1.5 text-center"
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

export default function ScanMetricsCard({ metrics, explanations }: ScanMetricsCardProps) {
  const [expandedKey, setExpandedKey] = useState<MetricKey | null>(null);

  const handlePress = (key: MetricKey) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const rows = [METRIC_CONFIG.slice(0, 3), METRIC_CONFIG.slice(3, 6), METRIC_CONFIG.slice(6, 8)];

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          <View className={`flex-row ${row.length < 3 ? 'justify-center' : 'justify-between'}`}>
            {row.map((m) => (
              <MetricItem
                key={m.key}
                metricKey={m.key}
                label={m.label}
                color={m.color}
                score={metrics[m.key].uiScore}
                explanation={explanations?.[m.key]}
                isExpanded={expandedKey === m.key}
                onPress={() => handlePress(m.key)}
              />
            ))}
          </View>
          {/* Show expanded explanation below the row it belongs to */}
          {expandedKey && row.some((m) => m.key === expandedKey) && explanations?.[expandedKey] && (
            <ExpandableExplanation
              explanation={explanations[expandedKey]}
              isExpanded={true}
            />
          )}
        </React.Fragment>
      ))}
      {explanations && (
        <Text className="text-[10px] font-poppins-regular text-skin-text-tertiary text-center mt-2">
          Tap a metric for details
        </Text>
      )}
    </View>
  );
}
