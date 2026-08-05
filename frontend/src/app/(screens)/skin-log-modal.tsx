import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { uploadSkinPhoto } from "../../api/uploadPhoto";
import { useGetToken } from "../../hooks/useApi";
import { COLORS } from "../../constants/theme";
import { toast } from "../../lib/toast";
import CircleIconButton from "../../components/ui/CircleIconButton";
import Chip from "../../components/ui/Chip";
import FaceIcon from "../../components/dashboard/FaceIcon";
import { useLogMood } from "../../hooks/queries/useMoods";
import { useRoutines } from "../../hooks/queries/useRoutines";
import { useQuizAnswers } from "../../hooks/queries/useQuiz";
import { useAutoSaveSkinLog } from "../../hooks/useAutoSaveSkinLog";
import Card from "../../components/ui/Card";
import type { RoutineStep } from "../../types/api";

const MOODS = [
  { label: "Bad", value: "Bad", color: "#FF3B30" },
  { label: "Not great", value: "Meh", color: "#FF9500" },
  { label: "Okay", value: "Okay", color: "#FFCC00" },
  { label: "Good", value: "Good", color: "#34C759" },
  { label: "Awesome", value: "Great", color: "#30D158" },
] as const;

const CONCERNS = [
  "Dryness",
  "Oiliness",
  "Acne",
  "Redness",
  "Dark spots",
  "Wrinkles",
  "Pores",
  "Sensitivity",
  "Dullness",
  "Uneven tone",
  "Dark circles",
  "Texture",
];

const LIFESTYLE_FACTORS = [
  "Good sleep",
  "Poor sleep",
  "Stressed",
  "Relaxed",
  "Exercised",
  "Hydrated",
  "Ate clean",
  "Junk food",
  "Sun exposure",
  "Wore sunscreen",
  "New product",
  "Period",
];

const FACE_FEELINGS = [
  { label: "Glowy", icon: "sparkles-outline" },
  { label: "Comfortable", icon: "happy-outline" },
  { label: "Soft", icon: "leaf-outline" },
  { label: "Smooth", icon: "water-outline" },
  { label: "Calm", icon: "snow-outline" },
  { label: "Hydrated", icon: "rainy-outline" },
  { label: "Dry", icon: "thermometer-outline" },
  { label: "Oily", icon: "ellipse-outline" },
  { label: "Breaking out", icon: "alert-outline" },
  { label: "Puffy", icon: "resize-outline" },
  { label: "Itchy", icon: "hand-left-outline" },
  { label: "Peeling", icon: "layers-outline" },
  { label: "Burning", icon: "flame-outline" },
];

const PERIOD_OPTIONS = [
  { label: "About to start", icon: "calendar-outline" },
  { label: "Yes", icon: "water-outline" },
  { label: "Ovulation", icon: "ellipse-outline" },
  { label: "No, I'm not", icon: "close-circle-outline" },
  { label: "Not applicable", icon: "close-outline" },
];

const SLEEP_OPTIONS = ["Not Good", "OK", "Great"];
const ACTIVITY_OPTIONS = ["Didn't move", "Light", "Moderate", "Intense"];
const SUN_OPTIONS = ["15+ min", "15 min or less", "Not at all"];
const OTHER_FACTORS = [
  { label: "No, there were none", icon: "close-outline" },
  { label: "Stress", icon: "pulse-outline" },
  { label: "Breastfeeding", icon: "people-outline" },
  { label: "Pregnancy", icon: "heart-outline" },
  { label: "Flight", icon: "airplane-outline" },
  { label: "Alcohol", icon: "wine-outline" },
  { label: "Smoking", icon: "bonfire-outline" },
];

function AnimatedArrow({ direction }: { direction: "back" | "forward" }) {
  const tx = useSharedValue(0);

  useEffect(() => {
    const offset = direction === "back" ? -4 : 4;
    tx.value = withRepeat(
      withSequence(
        withTiming(offset, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons
        name={direction === "back" ? "chevron-back" : "chevron-forward"}
        size={18}
        color="#C7C7CC"
      />
    </Animated.View>
  );
}

function OptionSlider({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const knobSize = 70;
  const ARROW_SLOT = 28; // arrow width 24 + 4 margin
  const EDGE_PAD = knobSize / 2 + 4; // knob center can't be closer than this to edge

  const [containerWidth, setContainerWidth] = useState(0);

  // Usable range for knob center: from EDGE_PAD to containerWidth - EDGE_PAD
  const usableWidth = Math.max(0, containerWidth - EDGE_PAD * 2);
  const segCount = options.length - 1;
  const segmentWidth = segCount > 0 ? usableWidth / segCount : 0;

  // Position of dot/knob center for option i
  const getCenter = (i: number) => EDGE_PAD + i * segmentWidth;

  // Shared values for worklet-safe access
  const knobX = useSharedValue(selected * segmentWidth);
  const startX = useSharedValue(0);
  const segWidthSV = useSharedValue(segmentWidth);
  const usableWidthSV = useSharedValue(usableWidth);
  const optCountSV = useSharedValue(options.length);
  // Tracks which half-segment zone the knob is in:
  // even = on a label, odd = midpoint between two labels
  const lastHalfIndex = useSharedValue(selected * 2);

  useEffect(() => {
    segWidthSV.value = segmentWidth;
    usableWidthSV.value = usableWidth;
    optCountSV.value = options.length;
    lastHalfIndex.value = selected * 2;
    knobX.value = withTiming(selected * segmentWidth, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [selected, segmentWidth, usableWidth, options.length]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = knobX.value;
      const seg = segWidthSV.value;
      lastHalfIndex.value = seg > 0 ? Math.floor(knobX.value / (seg / 2)) : 0;
    })
    .onUpdate((e) => {
      const val = startX.value + e.translationX;
      knobX.value = Math.max(0, Math.min(val, usableWidthSV.value));

      const seg = segWidthSV.value;
      if (seg > 0) {
        const halfSeg = seg / 2;
        const maxHalf = (optCountSV.value - 1) * 2;
        const currentHalf = Math.max(0, Math.min(
          Math.floor(knobX.value / halfSeg),
          maxHalf,
        ));
        if (currentHalf !== lastHalfIndex.value) {
          lastHalfIndex.value = currentHalf;
          if (currentHalf % 2 === 0) {
            // On a label position — stronger tick
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
          } else {
            // Midpoint between two labels — softer tick
            runOnJS(Haptics.selectionAsync)();
          }
        }
      }
    })
    .onEnd(() => {
      const seg = segWidthSV.value;
      const snapIndex = seg > 0 ? Math.round(knobX.value / seg) : 0;
      const clamped = Math.max(0, Math.min(snapIndex, optCountSV.value - 1));
      knobX.value = withTiming(clamped * seg, { duration: 200, easing: Easing.out(Easing.ease) });
      runOnJS(onSelect)(clamped);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    });

  // translateX moves the knob group; knob center = EDGE_PAD - ARROW_SLOT - knobSize/2 + ARROW_SLOT + knobSize/2 + knobX = EDGE_PAD + knobX
  // So knob center aligns with getCenter(i) when knobX = i * segmentWidth ✓
  const knobGroupLeft = EDGE_PAD - ARROW_SLOT - knobSize / 2;

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }],
  }));

  if (containerWidth === 0) {
    return <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)} style={{ height: 100 }} />;
  }

  return (
    <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <View
        style={{
          height: 75,
          borderRadius: 40,
          backgroundColor: "#EBEBF0",
          justifyContent: "center",
        }}
      >
        {/* Dot indicators (tappable) */}
        {options.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(i);
            }}
            style={{
              position: "absolute",
              left: getCenter(i) - 16,
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
            }}
            hitSlop={8}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === selected ? "transparent" : "#C7C7CC",
              }}
            />
          </Pressable>
        ))}

        {/* Draggable knob with arrows */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                position: "absolute",
                left: knobGroupLeft,
                flexDirection: "row",
                alignItems: "center",
              },
              knobStyle,
            ]}
          >
            <View style={{ width: ARROW_SLOT, alignItems: "center" }}>
              <AnimatedArrow direction="back" />
            </View>
            <View
              style={{
                width: knobSize,
                height: knobSize,
                borderRadius: knobSize / 2,
                backgroundColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4,
              }}
            />
            <View style={{ width: ARROW_SLOT, alignItems: "center" }}>
              <AnimatedArrow direction="forward" />
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Labels aligned to dot/knob centers */}
      <View style={{ height: 20, marginTop: 6 }}>
        {options.map((label, i) => (
          <Text
            key={label}
            className="text-[13px]"
            style={{
              position: "absolute",
              left: getCenter(i) - 50,
              width: 100,
              textAlign: "center",
              color: i === selected ? "#3C3C43" : "#8E8E93",
              fontWeight: i === selected ? "600" : "400",
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const TOTAL_STEPS = 4;

function StepDots({ current }: { current: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2 mb-6">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? COLORS.primary : "#E5E5EA",
          }}
        />
      ))}
    </View>
  );
}

const STEP_ICONS: Record<string, string> = {
  cleanser: "water-outline",
  toner: "flask-outline",
  moisturizer: "sparkles-outline",
  serum: "eyedrop-outline",
  sunscreen: "sunny-outline",
  spf: "sunny-outline",
  exfoliant: "sparkles-outline",
  mask: "happy-outline",
  "eye cream": "eye-outline",
  "face exercises": "fitness-outline",
  "makeup remover": "brush-outline",
  retinol: "moon-outline",
};

function getStepIcon(name: string) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(STEP_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "sparkles-outline";
}

const VISIBLE_STEPS = 5;

function RoutineCard({ title, steps, selectedSteps, toggleStep }: { title: string; steps: RoutineStep[]; selectedSteps: string[]; toggleStep: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? steps : steps.slice(0, VISIBLE_STEPS);
  const hasMore = steps.length > VISIBLE_STEPS;

  return (
    <Card style={{ marginBottom: 8 }}>
      <Text className="text-lg text-gray-900 mb-3" style={{ fontWeight: "600" }}>
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {visible.map((step) => {
          const isSelected = selectedSteps.includes(step.id);
          return (
            <Pressable
              key={step.id}
              onPress={() => toggleStep(step.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: isSelected ? COLORS.primary : "transparent",
                backgroundColor: isSelected ? "rgba(240,102,128,0.08)" : "#F2F2F7",
              }}
            >
              <Ionicons
                name={getStepIcon(step.name) as keyof typeof Ionicons.glyphMap}
                size={14}
                color={isSelected ? COLORS.primary : "#8E8E93"}
              />
              <Text
                className="text-[13px]" style={{ fontWeight: "500", color: isSelected ? COLORS.primary : "#48484A" }}
              >
                {step.name}
              </Text>
            </Pressable>
          );
        })}
        {hasMore && !expanded && (
          <Pressable
            onPress={() => setExpanded(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: "#D1D1D6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <Text className="text-[13px] text-gray-400" style={{ fontWeight: "500" }}>
              Show more
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

export default function SkinLogModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mood?: string }>();

  const [step, setStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string>(params.mood || "");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [supplements, setSupplements] = useState<string | null>(null);
  const [supplementsList, setSupplementsList] = useState<string[]>([]);
  const [supplementInput, setSupplementInput] = useState("");
  const [showSupplementInput, setShowSupplementInput] = useState(false);
  const supplementInputRef = useRef<TextInput>(null);
  const [sleepIndex, setSleepIndex] = useState(1);
  const [activityIndex, setActivityIndex] = useState(1);
  const [sunIndex, setSunIndex] = useState(1);
  const [otherFactors, setOtherFactors] = useState<string[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);

  const toggleStep = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleFeeling = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFeelings((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label],
    );
  };

  const selectPeriod = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPeriod((prev) => (prev === label ? null : label));
  };

  const toggleOtherFactor = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (label === "No, there were none") {
      setOtherFactors((prev) => (prev.includes(label) ? [] : [label]));
    } else {
      setOtherFactors((prev) => {
        const without = prev.filter((f) => f !== "No, there were none");
        return without.includes(label)
          ? without.filter((f) => f !== label)
          : [...without, label];
      });
    }
  };

  const pickImage = () => {
    Alert.alert("Add a photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") return;
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: true,
            aspect: [3, 4],
          });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") return;
          const result = await ImagePicker.launchImageLibraryAsync({
            quality: 0.8,
            allowsEditing: true,
            aspect: [3, 4],
          });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const getToken = useGetToken();
  const logMood = useLogMood();
  const autoSave = useAutoSaveSkinLog();
  const [isUploading, setIsUploading] = useState(false);
  const { data: routines } = useRoutines();
  const { data: quizAnswers } = useQuizAnswers();

  const gender = quizAnswers?.find((a) => a.questionId === 1)?.answer;
  const showPeriod = gender === "Female" || gender === "Prefer not to say";

  const amRoutine = routines?.find((r) => r.type === "AM");
  const pmRoutine = routines?.find((r) => r.type === "PM");
  const amSteps = amRoutine?.steps ?? [];
  const pmSteps = pmRoutine?.steps ?? [];

  const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
  const CIRCLE1_SIZE = 340;
  const CIRCLE2_SIZE = 300;
  const CIRCLE3_SIZE = 260;

  function getMoodColor(mood: string) {
    return MOODS.find((m) => m.value === mood)?.color ?? "#E5E5EA";
  }

  function getLightMoodColor(mood: string) {
    const lightColors: Record<string, string> = {
      Bad: "#FFB3B0",
      Meh: "#FFD6A5",
      Okay: "#FFF1A8",
      Good: "#A8F0BF",
      Great: "#A8F5C0",
    };
    return lightColors[mood] ?? "#F0F0F0";
  }

  // Circle 1 animation
  const tx1 = useSharedValue(0);
  const ty1 = useSharedValue(0);

  // Circle 2 animation (offset timing for organic feel)
  const tx2 = useSharedValue(0);
  const ty2 = useSharedValue(0);

  // Circle 3 animation
  const tx3 = useSharedValue(0);
  const ty3 = useSharedValue(0);

  useEffect(() => {
    tx1.value = withRepeat(
      withSequence(
        withTiming(SCREEN_W * 0.25, {
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-SCREEN_W * 0.2, {
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(SCREEN_W * 0.1, {
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    ty1.value = withRepeat(
      withSequence(
        withTiming(-SCREEN_H * 0.15, {
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(SCREEN_H * 0.2, {
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-SCREEN_H * 0.05, {
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );

    tx2.value = withRepeat(
      withSequence(
        withTiming(-SCREEN_W * 0.2, {
          duration: 5500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(SCREEN_W * 0.3, {
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-SCREEN_W * 0.05, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    ty2.value = withRepeat(
      withSequence(
        withTiming(SCREEN_H * 0.18, {
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-SCREEN_H * 0.12, {
          duration: 5500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(SCREEN_H * 0.08, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    tx3.value = withRepeat(
      withSequence(
        withTiming(SCREEN_W * 0.15, {
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-SCREEN_W * 0.25, {
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(SCREEN_W * 0.2, {
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    ty3.value = withRepeat(
      withSequence(
        withTiming(-SCREEN_H * 0.1, {
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(SCREEN_H * 0.15, {
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-SCREEN_H * 0.08, {
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, []);

  const float1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx1.value }, { translateY: ty1.value }],
  }));

  const float2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx2.value }, { translateY: ty2.value }],
  }));

  const float3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx3.value }, { translateY: ty3.value }],
  }));

  const toggleItem = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
    );
  };

  // Auto-save effects — each triggers debounced save on change
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) return;
    if (selectedMood) {
      logMood.mutate(selectedMood);
      autoSave.save({ mood: selectedMood });
    }
  }, [selectedMood]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ feelings: selectedFeelings });
  }, [selectedFeelings]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ concerns: selectedConcerns });
  }, [selectedConcerns]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ completedSteps: selectedSteps });
  }, [selectedSteps]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ sleepQuality: SLEEP_OPTIONS[sleepIndex] });
  }, [sleepIndex]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ activityLevel: ACTIVITY_OPTIONS[activityIndex] });
  }, [activityIndex]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ sunExposure: SUN_OPTIONS[sunIndex] });
  }, [sunIndex]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ otherFactors });
  }, [otherFactors]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ periodStatus: selectedPeriod });
  }, [selectedPeriod]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ supplements });
  }, [supplements]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ waterGlasses });
  }, [waterGlasses]);

  useEffect(() => {
    if (isInitialMount.current) return;
    autoSave.save({ notes });
  }, [notes]);

  useEffect(() => {
    if (isInitialMount.current || !photoUri) return;
    (async () => {
      try {
        setIsUploading(true);
        const token = await getToken();
        if (!token) { toast.error("Could not authenticate. Please try again."); return; }
        const url = await uploadSkinPhoto(photoUri, token);
        autoSave.save({ photoUrl: url });
      } catch (e) {
        console.warn('Photo upload failed:', e);
      } finally {
        setIsUploading(false);
      }
    })();
  }, [photoUri]);

  // On mount: immediately save the initial mood so we always have a logId
  useEffect(() => {
    if (params.mood) {
      logMood.mutate(params.mood);
      autoSave.saveImmediate({ mood: params.mood });
    }
    isInitialMount.current = false;
  }, []);

  const handleClose = async () => {
    await autoSave.flush();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>
      {/* Floating mood circles behind blur */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: CIRCLE1_SIZE,
            height: CIRCLE1_SIZE,
            borderRadius: CIRCLE1_SIZE / 2,
            top: SCREEN_H * 0.2 - CIRCLE1_SIZE / 2,
            left: SCREEN_W * 0.3 - CIRCLE1_SIZE / 2,
            opacity: 0.55,
            backgroundColor: getLightMoodColor(selectedMood),
          },
          float1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: CIRCLE2_SIZE,
            height: CIRCLE2_SIZE,
            borderRadius: CIRCLE2_SIZE / 2,
            top: SCREEN_H * 0.55 - CIRCLE2_SIZE / 2,
            left: SCREEN_W * 0.65 - CIRCLE2_SIZE / 2,
            opacity: 0.45,
            backgroundColor: getLightMoodColor(selectedMood),
          },
          float2Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: CIRCLE3_SIZE,
            height: CIRCLE3_SIZE,
            borderRadius: CIRCLE3_SIZE / 2,
            top: SCREEN_H * 0.4 - CIRCLE3_SIZE / 2,
            left: SCREEN_W * 0.1 - CIRCLE3_SIZE / 2,
            opacity: 0.4,
            backgroundColor: getLightMoodColor(selectedMood),
          },
          float3Style,
        ]}
      />

      {/* Full-screen blur over the circles */}
      <BlurView tint="light" intensity={100} style={StyleSheet.absoluteFill} />

      {/* Content */}
      <SafeAreaView className="flex-1">
        {/* Sticky header with gradient blur (stacked strips, strong→none) */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
          pointerEvents="box-none"
        >
          {/* Fade-out gradient behind header */}
          <LinearGradient
            colors={["rgba(248,248,250,0.9)", "rgba(248,248,250,0)"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 80,
              zIndex: 0,
            }}
            pointerEvents="none"
          />
          {/* Header content */}
          <SafeAreaView edges={["top"]} pointerEvents="box-none">
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 24, zIndex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "rgba(0,0,0,0.15)",
                  marginBottom: 12,
                }}
              />
              <View style={{ flexDirection: "row", alignItems: "center", width: "100%", paddingHorizontal: 24 }}>
                <View style={{ width: 40 }} />
                <Text className="text-xl text-gray-900" style={{ flex: 1, textAlign: "center", fontWeight: "600" }}>
                  Skin Diary
                </Text>
                <CircleIconButton icon="close" onPress={handleClose} />
              </View>
            </View>
          </SafeAreaView>
        </View>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 110, paddingBottom: 40 }}
        >
          <Pressable
            className="items-center mb-6 justify-center"
            onPress={pickImage}
          >
            <View
              style={{
                width: 250,
                height: 280,
                marginTop: 20,
                backgroundColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
                transform: [{ rotate: "3deg" }],
              }}
              className="items-center justify-center rounded-sm"
            >
              <View
                style={{
                  width: 180,
                  height: 200,
                  backgroundColor: "#F0F0F0",
                  overflow: "hidden",
                }}
                className="items-center justify-center mb-4 rounded-sm"
              >
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: 180, height: 200 }}
                    resizeMode="cover"
                  />
                ) : (
                  <FaceIcon
                    mood={
                      MOODS.find((m) => m.value === selectedMood)?.label ??
                      "Okay"
                    }
                    size={140}
                    selected
                    noBackground
                  />
                )}
              </View>
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name={photoUri ? "camera-outline" : "add"}
                  size={24}
                  color={COLORS.primary}
                />
                <Text className="text-primary" style={{ fontWeight: "600" }}>
                  {photoUri ? "Change photo" : "Add a photo"}
                </Text>
              </View>
            </View>

            <Text className="text-3xl text-gray-900 mt-6 text-center" style={{ fontWeight: "600" }}>
              Skin feeling{" "}
              <Text
                style={{
                  color: getMoodColor(selectedMood),
                  fontStyle: "italic",
                }}
              >
                {MOODS.find((m) => m.value === selectedMood)?.label ??
                  selectedMood}
              </Text>
            </Text>
          </Pressable>

          {amSteps.length > 0 && (
            <RoutineCard title="Morning Routine" steps={amSteps} selectedSteps={selectedSteps} toggleStep={toggleStep} />
          )}

          {pmSteps.length > 0 && (
            <RoutineCard title="Evening Routine" steps={pmSteps} selectedSteps={selectedSteps} toggleStep={toggleStep} />
          )}

          {/* Face Feelings */}
          <Card style={{ marginBottom: 8 }}>
            <Text className="text-lg text-gray-900 mb-3" style={{ fontWeight: "600" }}>
              Describe your face feelings
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FACE_FEELINGS.map(({ label, icon }) => {
                const isSelected = selectedFeelings.includes(label);
                return (
                  <Pressable
                    key={label}
                    onPress={() => toggleFeeling(label)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: isSelected ? COLORS.primary : "transparent",
                      backgroundColor: isSelected ? "rgba(240,102,128,0.08)" : "#F2F2F7",
                    }}
                  >
                    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={isSelected ? COLORS.primary : "#8E8E93"} />
                    <Text className="text-[13px]" style={{ fontWeight: "500", color: isSelected ? COLORS.primary : "#48484A" }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Supplements */}
          <Card style={{ marginBottom: 8 }}>
            <Text className="text-lg text-gray-900 mb-3" style={{ fontWeight: "600" }}>
              Any supplements for skin health?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSupplementInput(false);
                  setSupplementInput("");
                  setSupplements((prev) => (prev === "no" ? null : "no"));
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: supplements === "no" && supplementsList.length === 0 ? COLORS.primary : "transparent",
                  backgroundColor: supplements === "no" && supplementsList.length === 0 ? "rgba(240,102,128,0.08)" : "#F2F2F7",
                }}
              >
                <Ionicons name="close-outline" size={14} color={supplements === "no" && supplementsList.length === 0 ? COLORS.primary : "#8E8E93"} />
                <Text className="text-[13px]" style={{ fontWeight: "500", color: supplements === "no" && supplementsList.length === 0 ? COLORS.primary : "#48484A" }}>
                  No, I don't
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSupplements("yes");
                  setShowSupplementInput(true);
                  setTimeout(() => supplementInputRef.current?.focus(), 100);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: showSupplementInput || supplementsList.length > 0 ? COLORS.primary : "transparent",
                  backgroundColor: showSupplementInput || supplementsList.length > 0 ? "rgba(240,102,128,0.08)" : "#F2F2F7",
                }}
              >
                <Ionicons name="add-outline" size={14} color={showSupplementInput || supplementsList.length > 0 ? COLORS.primary : "#8E8E93"} />
                <Text className="text-[13px]" style={{ fontWeight: "500", color: showSupplementInput || supplementsList.length > 0 ? COLORS.primary : "#48484A" }}>
                  Add
                </Text>
              </Pressable>
              {supplementsList.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const updated = supplementsList.filter((s) => s !== name);
                    setSupplementsList(updated);
                    setSupplements(updated.length > 0 ? updated.join(", ") : null);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: COLORS.primary,
                    backgroundColor: "rgba(240,102,128,0.08)",
                  }}
                >
                  <Text className="text-[13px]" style={{ fontWeight: "500", color: COLORS.primary }}>
                    {name}
                  </Text>
                  <Ionicons name="close" size={12} color={COLORS.primary} />
                </Pressable>
              ))}
            </View>
            {showSupplementInput && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 12,
                  backgroundColor: "#F2F2F7",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                }}
              >
                <TextInput
                  ref={supplementInputRef}
                  value={supplementInput}
                  onChangeText={setSupplementInput}
                  placeholder="e.g. Vitamin C, Zinc, Collagen…"
                  placeholderTextColor="#C7C7CC"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    const trimmed = supplementInput.trim();
                    if (trimmed && !supplementsList.includes(trimmed)) {
                      const updated = [...supplementsList, trimmed];
                      setSupplementsList(updated);
                      setSupplements(updated.join(", "));
                    }
                    setSupplementInput("");
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: "#1C1C1E",
                  }}
                />
                <Pressable
                  onPress={() => {
                    const trimmed = supplementInput.trim();
                    if (trimmed && !supplementsList.includes(trimmed)) {
                      const updated = [...supplementsList, trimmed];
                      setSupplementsList(updated);
                      setSupplements(updated.join(", "));
                    }
                    setSupplementInput("");
                  }}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: COLORS.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </Pressable>
              </View>
            )}
          </Card>

          {/* Sleep */}
          <Card style={{ marginBottom: 8 }}>
            <Text className="text-lg text-gray-900 mb-4" style={{ fontWeight: "600" }}>
              How well did you sleep last night?
            </Text>
            <OptionSlider options={SLEEP_OPTIONS} selected={sleepIndex} onSelect={setSleepIndex} />
          </Card>

          {/* Physical Activity */}
          <Card style={{ marginBottom: 8 }}>
            <Text className="text-lg text-gray-900 mb-4" style={{ fontWeight: "600" }}>
              Did you have physical activity recently?
            </Text>
            <OptionSlider options={ACTIVITY_OPTIONS} selected={activityIndex} onSelect={setActivityIndex} />
          </Card>

          {/* Sun Exposure */}
          <Card style={{ marginBottom: 8 }}>
            <Text className="text-lg text-gray-900 mb-4" style={{ fontWeight: "600" }}>
              Any sun exposure without SPF recently?
            </Text>
            <OptionSlider options={SUN_OPTIONS} selected={sunIndex} onSelect={setSunIndex} />
          </Card>

          {/* Other Factors */}
          <Card style={{ marginBottom: 8 }}>
            <Text className="text-lg text-gray-900 mb-3" style={{ fontWeight: "600" }}>
              Were there any other factors?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {OTHER_FACTORS.map(({ label, icon }) => {
                const isSelected = otherFactors.includes(label);
                return (
                  <Pressable
                    key={label}
                    onPress={() => toggleOtherFactor(label)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: isSelected ? COLORS.primary : "transparent",
                      backgroundColor: isSelected ? "rgba(240,102,128,0.08)" : "#F2F2F7",
                    }}
                  >
                    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={isSelected ? COLORS.primary : "#8E8E93"} />
                    <Text className="text-[13px]" style={{ fontWeight: "500", color: isSelected ? COLORS.primary : "#48484A" }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Period - only for female / prefer not to say */}
          {showPeriod && (
            <Card style={{ marginBottom: 8 }}>
              <Text className="text-lg text-gray-900 mb-3" style={{ fontWeight: "600" }}>
                Are you on your period?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PERIOD_OPTIONS.map(({ label, icon }) => {
                  const isSelected = selectedPeriod === label;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => selectPeriod(label)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1.5,
                        borderColor: isSelected ? COLORS.primary : "transparent",
                        backgroundColor: isSelected ? "rgba(240,102,128,0.08)" : "#F2F2F7",
                      }}
                    >
                      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={isSelected ? COLORS.primary : "#8E8E93"} />
                      <Text className="text-[13px]" style={{ fontWeight: "500", color: isSelected ? COLORS.primary : "#48484A" }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          )}

          {/* Water Intake */}
          <Card style={{ marginBottom: 8 }}>
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="water" size={20} color="#5AC8FA" />
              <Text className="text-lg text-gray-900" style={{ fontWeight: "600" }}>
                Water
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWaterGlasses((prev) => Math.max(0, prev - 1));
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#F2F2F7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="remove" size={22} color="#8E8E93" />
              </Pressable>
              <View className="items-center">
                <Text className="text-3xl text-gray-900" style={{ fontWeight: "700" }}>
                  {waterGlasses}
                  <Text className="text-3xl text-gray-400" style={{ fontWeight: "400" }}>/8</Text>
                  <Text className="text-xl text-gray-900" style={{ fontWeight: "600" }}> glasses</Text>
                </Text>
                <Text className="text-sm text-gray-400" style={{ fontWeight: "400" }}>
                  {waterGlasses * 250} ml
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWaterGlasses((prev) => prev + 1);
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#F2F2F7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={22} color="#8E8E93" />
              </Pressable>
            </View>
          </Card>

          {/* Notes */}
          <Card style={{ marginBottom: 8 }}>
            <Text className="text-lg text-gray-900 mb-3" style={{ fontWeight: "600" }}>
              Your Note
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Would you like to add some notes?"
              placeholderTextColor="#C7C7CC"
              multiline
              textAlignVertical="top"
              style={{
                backgroundColor: "#F2F2F7",
                borderRadius: 12,
                padding: 14,
                minHeight: 100,
                fontSize: 14,
                fontWeight: "400",
                color: "#1C1C1E",
              }}
            />
          </Card>

          {/* Auto-save indicator */}
          {autoSave.isSaving && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, marginBottom: 20 }}>
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
              <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Saving...</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
