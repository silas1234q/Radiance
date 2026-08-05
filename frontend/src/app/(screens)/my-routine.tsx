import React, { useRef, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CircleIconButton from "../../components/ui/CircleIconButton";
import { useRoutines } from "../../hooks/queries/useRoutines";
import WeekDayTracker from "../../components/routine/WeekDayTracker";
import SectionDivider from "../../components/routine/SectionDivider";
import RoutineStepCard from "../../components/routine/RoutineStepCard";
import AddProductSheet, { type AddProductSheetRef } from "../../components/routine/AddProductSheet";

export default function MyRoutineScreen() {
  const router = useRouter();
  const addSheetRef = useRef<AddProductSheetRef>(null);
  const openAddSheet = useCallback(() => addSheetRef.current?.present(), []);
  const { data: routines, isLoading } = useRoutines();

  const amRoutine = routines?.find((r) => r.type === "AM");
  const pmRoutine = routines?.find((r) => r.type === "PM");
  const amSteps = amRoutine?.steps ?? [];
  const pmSteps = pmRoutine?.steps ?? [];

  const today = new Date().getDay();
  const completedDays = Array.from({ length: today }, (_, i) => i);

  return (
    <View className="flex-1 bg-gray-200">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header with back button and centered title */}
        <View className="relative items-center justify-center mt-2 mb-5 px-[20px]" style={{ height: 44 }}>
          {/* Centered title (absolute so it's truly centered) */}
          <Text
            className="text-[20px] tracking-[-0.4px] text-skin-text"
            style={{ fontWeight: "600" }}
          >
            My Routine
          </Text>

          {/* Back button - left */}
          <CircleIconButton
            icon="chevron-back"
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 20 }}
          />

          {/* Action buttons - right */}
          <View
            className="absolute right-[20px] flex-row items-center gap-2"
          >
            <CircleIconButton icon="ellipsis-horizontal" />
            <CircleIconButton icon="add" onPress={() => openAddSheet()} />
          </View>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Week tracker */}
          <WeekDayTracker completedDays={completedDays} />

          {/* Morning Routine */}
          <SectionDivider label="Morning Routine" />
          <View className="gap-3">
            {amSteps.map((step, index: number) => (
              <RoutineStepCard
                key={step.id}
                name={step.name}
                description={step.description}
                productName={step.product?.name}
                isCompleted={step.isCompleted}
                onToggle={() =>
                  router.push({
                    pathname: "/routine-steps",
                    params: { routineId: amRoutine.id, initialStep: index },
                  })
                }
              />
            ))}
          </View>

          {/* Evening Routine */}
          <SectionDivider label="Evening Routine" />
          <View className="gap-3">
            {pmSteps.map((step, index: number) => (
              <RoutineStepCard
                key={step.id}
                name={step.name}
                description={step.description}
                productName={step.product?.name}
                isCompleted={step.isCompleted}
                onToggle={() =>
                  router.push({
                    pathname: "/routine-steps",
                    params: { routineId: pmRoutine.id, initialStep: index },
                  })
                }
              />
            ))}
          </View>

          {amSteps.length === 0 && pmSteps.length === 0 && !isLoading && (
            <View className="items-center py-[60px]">
              <Ionicons name="sparkles" size={48} color="#F06680" style={{ marginBottom: 16 }} />
              <Text className="text-base text-skin-text-secondary text-center max-w-[240px] leading-[22px]">
                Complete the skin quiz to get your personalized routine
              </Text>
            </View>
          )}

          {/* AI Note */}
          {(amSteps.length > 0 || pmSteps.length > 0) && (
            <View
              className="mt-6 p-4 rounded-[18px]"
              style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
            >
              <Text className="text-[13px] text-skin-text-secondary text-center leading-[18px]">
                Your routine adapts based on your skin progress and daily logs
              </Text>
            </View>
          )}
        </ScrollView>
        <AddProductSheet ref={addSheetRef} />
      </SafeAreaView>
    </View>
  );
}
