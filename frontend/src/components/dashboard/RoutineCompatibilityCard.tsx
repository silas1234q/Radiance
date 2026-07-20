import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "../../constants/theme";
import GlassCard from "../ui/GlassCard";
import { Image } from "expo-image";
import productImage from "../../assets/images/products.jpg";

interface RoutineCompatibilityCardProps {
  compatibilityScore: number;
  goalsMetCount: number;
  totalGoals: number;
  productCount: number;
  onPress?: () => void;
}

function MiniCircularProgress({
  score,
  size = 48,
  strokeWidth = 5,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const color = score >= 70 ? "#34C759" : score >= 40 ? "#FF9500" : "#F06680";

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-[14px] font-poppins-bold" style={{ color }}>
          {score}
        </Text>
      </View>
    </View>
  );
}

function getCompatibilityLabel(score: number): string {
  if (score >= 80) return "Great match for your skin";
  if (score >= 60) return "Getting there for your skin";
  if (score >= 40) return "Room for improvement";
  return "Needs attention";
}

export default function RoutineCompatibilityCard({
  compatibilityScore,
  goalsMetCount,
  totalGoals,
  productCount,
  onPress,
}: RoutineCompatibilityCardProps) {
  return (
    <GlassCard style={{ marginBottom: 16 }}>
      {/* Top row: Title + chevron */}
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between mb-4"
      >
        <Text className="text-lg font-poppins-bold text-skin-text">
          My Routine
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textTertiary}
        />
      </Pressable>

      {/* Stats row */}
      <View className="flex-row justify-between mb-4 items-center">
        <View className="flex-row gap-6 flex-1">
          <View>
            <Text className="text-[18px] font-poppins-bold text-skin-text">
              {goalsMetCount}/{totalGoals}
            </Text>
            <Text className="text-[12px] font-poppins-medium text-skin-text-tertiary">
              Goals met
            </Text>
          </View>
          <View>
            <Text className="text-[18px] font-poppins-bold text-skin-text">
              {productCount}
            </Text>
            <Text className="text-[12px] font-poppins-medium text-skin-text-tertiary">
              Products
            </Text>
          </View>
        </View>

        <View
          className=" items-center rounded-sm overflow-hidden justify-center"
          style={{ width: 60, height: 60 }}
        >
          <Image source={productImage} style={{ width: '100%', height: '100%' }} />
        </View>
      </View>

      {/* Compatibility bar */}
      <View
        className="flex-row items-center justify-between"
        style={{
          backgroundColor: "rgba(255,255,255,0.5)",
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-1 mr-3">
          <Text className="text-[14px] font-poppins-bold text-skin-text">
            Routine Compatibility
          </Text>
          <Text className="text-[12px] font-poppins-medium text-skin-text-secondary mt-0.5">
            {getCompatibilityLabel(compatibilityScore)}
          </Text>
        </View>
        <MiniCircularProgress score={compatibilityScore} />
      </View>
    </GlassCard>
  );
}
