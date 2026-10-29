import { View, Text } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const CARDS: {
  id: number;
  title: string;
  description: string;
  icon: IconName;
}[] = [
  { id: 1, title: "Clear skin", description: "Fewer breakouts and blemishes", icon: "sparkles" },
  { id: 2, title: "Even tone", description: "Fades dark spots and redness", icon: "contrast-outline" },
  { id: 3, title: "Smooth texture", description: "Soft, refined skin", icon: "layers-outline" },
  { id: 4, title: "Healthy glow", description: "Naturally radiant and fresh", icon: "sunny-outline" },
];

const WelcomeCards = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      className="absolute right-2 justify-between"
      style={{ top: insets.top + 60, bottom: insets.bottom + 140 }}
    >
      {CARDS.map((card, i) => (
        <Animated.View
          key={card.id}
          entering={FadeInRight.delay(i * 120).duration(400)}
          className="flex-row items-center"
        >
          {/* Connector stub, always aligned with its card */}
          <View className="w-1.5 h-1.5 rounded-full bg-white" />
          <View className="w-6 h-px bg-white" />

          <View className="bg-white/95 rounded-2xl w-[140px] p-3 border border-white shadow-lg">
            <View className="bg-primary rounded-full w-9 h-9 items-center justify-center mb-2">
              <Ionicons name={card.icon} size={18} color="#FFFFFF" />
            </View>
            <Text className="font-sans-bold text-sm text-primary">
              {card.title}
            </Text>
            <Text className="font-sans text-xs leading-4 text-gray-500 mt-0.5">
              {card.description}
            </Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

export default WelcomeCards;