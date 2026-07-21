import React, { useRef, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  useRoutines,
  useUpdateStep,
  useDeleteRoutine,
  useDetailedInsight,
  useCompleteRoutine,
} from "../../hooks/queries/useRoutines";
import { useWeeklyCompletions } from "../../hooks/queries/useGamification";
import XpToast from "../../components/ui/XpToast";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSkinProfile } from "../../hooks/queries/useProfile";
import WeekDayTracker from "../../components/routine/WeekDayTracker";
import SectionDivider from "../../components/routine/SectionDivider";
import RoutineStepCard from "../../components/routine/RoutineStepCard";
import RoutineSkeleton, {
  InsightSkeleton,
} from "../../components/routine/RoutineSkeleton";
import AddProductSheet, {
  type AddProductSheetRef,
} from "../../components/routine/AddProductSheet";
import GlassIconButton from "../../components/ui/GlassIconButton";
import ActionMenu, {
  type ActionMenuGroup,
} from "../../components/ui/ActionMenu";
import { COLORS } from "../../constants/theme";
import type { Routine, RoutineStep } from "../../types/api";

export default function RoutineScreen() {
  const router = useRouter();
  const addSheetRef = useRef<AddProductSheetRef>(null);
  const actionSheetRef = useRef<BottomSheetModal>(null);
  const productSelectSheetRef = useRef<AddProductSheetRef>(null);
  const openAddSheet = useCallback(() => addSheetRef.current?.present(), []);
  const { data: routines, isLoading, isFetching } = useRoutines();
  const { data: skinProfile } = useSkinProfile();
  const { data: weeklyCompletions } = useWeeklyCompletions();
  const [xpToastVisible, setXpToastVisible] = useState(false);

  const { top } = useSafeAreaInsets();

  const updateStep = useUpdateStep();
  const deleteRoutine = useDeleteRoutine();
  const completeRoutine = useCompleteRoutine();

  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("default");
  const [selectedStepTarget, setSelectedStepTarget] = useState<{
    routineId: string;
    stepId: string;
  } | null>(null);

  // Compute which routines are currently visible to check for products
  const selectedSteps =
    selectedRoutineId === "default"
      ? routines?.filter((r) => r.type === "AM" || r.type === "PM")
      : routines?.filter((r) => r.id === selectedRoutineId);
  const hasStepsWithProducts = selectedSteps?.some((r) =>
    r.steps?.some((s) => s.product),
  );
  const { data: insightData, isLoading: insightLoading } = useDetailedInsight(
    selectedRoutineId,
    !!hasStepsWithProducts,
  );

  const amRoutine = routines?.find((r) => r.type === "AM");
  const pmRoutine = routines?.find((r) => r.type === "PM");
  const customRoutines = routines?.filter((r) => r.type === "CUSTOM") ?? [];
  const amSteps = amRoutine?.steps ?? [];
  const pmSteps = pmRoutine?.steps ?? [];

  const amAllDone = amSteps.length > 0 && amSteps.every((s) => s.isCompleted);
  const pmAllDone = pmSteps.length > 0 && pmSteps.every((s) => s.isCompleted);

  const handleCompleteRoutine = useCallback(
    (routineId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      completeRoutine.mutate(routineId, {
        onSuccess: () => setXpToastVisible(true),
      });
    },
    [completeRoutine],
  );

  const selectedCustomRoutine =
    selectedRoutineId !== "default"
      ? customRoutines.find((r) => r.id === selectedRoutineId)
      : null;
  const headerTitle =
    selectedRoutineId === "default"
      ? "My Routine"
      : (selectedCustomRoutine?.name ?? "My Routine");

  const openActionSheet = useCallback(() => {
    actionSheetRef.current?.present();
  }, []);

  const handleShare = useCallback(async () => {
    const lines: string[] = [];
    if (selectedRoutineId === "default") {
      if (amSteps.length > 0) {
        lines.push("Morning Routine:");
        amSteps.forEach((s, i: number) =>
          lines.push(
            `${i + 1}. ${s.name}${s.description ? " \u2014 " + s.description : ""}`,
          ),
        );
        lines.push("");
      }
      if (pmSteps.length > 0) {
        lines.push("Evening Routine:");
        pmSteps.forEach((s, i: number) =>
          lines.push(
            `${i + 1}. ${s.name}${s.description ? " \u2014 " + s.description : ""}`,
          ),
        );
      }
    } else if (selectedCustomRoutine && (selectedCustomRoutine.steps?.length ?? 0) > 0) {
      lines.push(`${selectedCustomRoutine.name}:`);
      selectedCustomRoutine.steps!.forEach((s, i: number) =>
        lines.push(
          `${i + 1}. ${s.name}${s.description ? " \u2014 " + s.description : ""}`,
        ),
      );
    }
    if (lines.length > 0) {
      await Share.share({ message: lines.join("\n") });
    }
  }, [selectedRoutineId, selectedCustomRoutine, amSteps, pmSteps]);

  const handleDeleteRoutine = useCallback(() => {
    if (selectedRoutineId === "default" || !selectedCustomRoutine) return;
    Alert.alert(
      "Delete Routine",
      `Delete "${selectedCustomRoutine.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRoutine.mutate(selectedCustomRoutine.id);
            setSelectedRoutineId("default");
          },
        },
      ],
    );
  }, [selectedRoutineId, selectedCustomRoutine, deleteRoutine]);

  const handleImagePress = useCallback((routineId: string, stepId: string) => {
    setSelectedStepTarget({ routineId, stepId });
    productSelectSheetRef.current?.present();
  }, []);

  const handleProductSelect = useCallback(
    (product: {
      id: string;
      name: string;
      brand: string;
      imageUrl?: string;
    }) => {
      if (!selectedStepTarget) return;
      updateStep.mutate({
        routineId: selectedStepTarget.routineId,
        stepId: selectedStepTarget.stepId,
        data: { productId: product.id },
      });
      setSelectedStepTarget(null);
    },
    [selectedStepTarget, updateStep],
  );

  const actionGroups = useMemo((): ActionMenuGroup[] => {
    const switchGroup: ActionMenuGroup = [
      {
        icon:
          selectedRoutineId === "default"
            ? "checkmark-circle"
            : "ellipse-outline",
        label: "My Routine",
        onPress: () => {
          setSelectedRoutineId("default");
          actionSheetRef.current?.dismiss();
        },
      },
      ...customRoutines.map((r) => ({
        icon: (selectedRoutineId === r.id
          ? "checkmark-circle"
          : "ellipse-outline") as keyof typeof Ionicons.glyphMap,
        label: r.name || "Custom Routine",
        onPress: () => {
          setSelectedRoutineId(r.id);
          actionSheetRef.current?.dismiss();
        },
      })),
    ];

    const primary: ActionMenuGroup = [
      {
        icon: "add",
        label: "New Routine",
        onPress: () => router.push("/new-routine"),
      },
    ];

    const secondary: ActionMenuGroup = [
      {
        icon: "create-outline",
        label: "Edit Steps",
        onPress: () => {
          const targetRoutineId =
            selectedRoutineId === "default"
              ? amRoutine?.id || pmRoutine?.id
              : selectedRoutineId;
          if (targetRoutineId) {
            actionSheetRef.current?.dismiss();
            router.push({
              pathname: "/add-steps",
              params: { routineId: targetRoutineId },
            });
          }
        },
      },
      { icon: "share-outline", label: "Share Routine", onPress: handleShare },
    ];

    const groups = [switchGroup, primary, secondary];

    if (selectedRoutineId !== "default") {
      const destructive: ActionMenuGroup = [
        {
          icon: "trash-outline",
          label: "Delete Routine",
          onPress: handleDeleteRoutine,
          destructive: true,
        },
      ];
      groups.push(destructive);
    }

    return groups;
  }, [
    handleShare,
    handleDeleteRoutine,
    selectedRoutineId,
    customRoutines,
    amRoutine,
    pmRoutine,
    router,
  ]);

  const renderStepCard = (
    step: RoutineStep,
    index: number,
    routine: Routine,
  ) => (
    <View key={step.id} style={{ position: "relative" }}>
      <RoutineStepCard
        name={step.name}
        description={step.description ?? undefined}
        productName={step.product?.name}
        isCompleted={step.isCompleted}
        productImageUrl={step.product?.imageUrl ?? undefined}
        onImagePress={() => handleImagePress(routine.id, step.id)}
        onToggle={() =>
          router.push({
            pathname: "/routine-steps",
            params: { routineId: routine.id, initialStep: index },
          })
        }
      />
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-200">
        <SafeAreaView className="flex-1" edges={["top"]}>
          <RoutineSkeleton />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100,paddingTop: top }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          className="relative items-center justify-center mt-2 mb-5"
          style={{ height: 44 }}
        >
          <Text
            className="text-[20px] tracking-[-0.4px] text-skin-text"
            style={{ fontWeight: "600" }}
          >
            {headerTitle}
          </Text>
          <View className="absolute right-0 flex-row items-center gap-2">
            <GlassIconButton
              icon="ellipsis-horizontal"
              onPress={openActionSheet}
              size={38}
              iconSize={20}
            />
            <GlassIconButton
              icon="add"
              onPress={() => openAddSheet()}
              size={38}
              iconSize={22}
            />
          </View>
        </View>

        {/* Week tracker */}
        <WeekDayTracker weeklyCompletions={weeklyCompletions} />

        {/* Syncing indicator */}
        {isFetching && !isLoading && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 8,
            }}
          >
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "SFProRounded_Regular",
                color: COLORS.textSecondary,
              }}
            >
              Syncing...
            </Text>
          </View>
        )}

        {/* Routine Insight Card */}
        {insightLoading && <InsightSkeleton />}
        {!insightLoading &&
          insightData &&
          insightData.compatibilityScore > 0 && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/routine-insight",
                  params: { routineId: selectedRoutineId },
                })
              }
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                marginTop: 4,
                marginBottom: 8,
              })}
            >
              <LinearGradient
                colors={["#FFF5F0", "#FFF0F3", "#F9F0FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 18,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    borderWidth: 3,
                    borderColor:
                      insightData.compatibilityScore >= 70
                        ? COLORS.success
                        : insightData.compatibilityScore >= 50
                          ? COLORS.warning
                          : COLORS.error,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "SFProRounded_Bold",
                      color:
                        insightData.compatibilityScore >= 70
                          ? "#2E7D32"
                          : insightData.compatibilityScore >= 50
                            ? "#E65100"
                            : "#C62828",
                    }}
                  >
                    {insightData.compatibilityScore}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "SFProRounded_Semibold",
                      color: COLORS.text,
                    }}
                  >
                    Routine Insight
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "SFProRounded_Regular",
                      color: COLORS.textSecondary,
                      marginTop: 1,
                    }}
                    numberOfLines={2}
                  >
                    {insightData.summary}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textTertiary}
                />
              </LinearGradient>
            </Pressable>
          )}

        {/* Routine sections based on selection */}
        {selectedRoutineId === "default" ? (
          <>
            {/* Morning Routine */}
            <SectionDivider label="Morning Routine" />
            <View className="gap-3">
              {amSteps.map((step, index: number) =>
                renderStepCard(step, index, amRoutine!),
              )}
            </View>
            {amSteps.length > 0 && !amAllDone && amRoutine && (
              <Pressable
                onPress={() => handleCompleteRoutine(amRoutine.id)}
                disabled={completeRoutine.isPending}
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 999,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#fff",
                    fontFamily: "SFProRounded_Bold",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            )}

            {/* Evening Routine */}
            <SectionDivider label="Evening Routine" />
            <View className="gap-3">
              {pmSteps.map((step, index: number) =>
                renderStepCard(step, index, pmRoutine!),
              )}
            </View>
            {pmSteps.length > 0 && !pmAllDone && pmRoutine && (
              <Pressable
                onPress={() => handleCompleteRoutine(pmRoutine.id)}
                disabled={completeRoutine.isPending}
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 999,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#fff",
                    fontFamily: "SFProRounded_Bold",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            )}
          </>
        ) : selectedCustomRoutine ? (
          (() => {
            const allSteps = (selectedCustomRoutine.steps ?? [])
              .slice()
              .sort((a, b) => a.order - b.order);
            const morningSteps = allSteps.filter((s) =>
              s.description?.startsWith("[AM]"),
            );
            const eveningSteps = allSteps.filter((s) =>
              s.description?.startsWith("[PM]"),
            );
            const untaggedSteps = allSteps.filter(
              (s) =>
                !s.description?.startsWith("[AM]") &&
                !s.description?.startsWith("[PM]"),
            );

            if (allSteps.length === 0) {
              return (
                <>
                  <SectionDivider
                    label={selectedCustomRoutine.name || "Custom Routine"}
                  />
                  <View className="gap-3">
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/add-steps",
                          params: { routineId: selectedCustomRoutine.id },
                        })
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.4)",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.6)",
                        borderRadius: 18,
                        borderStyle: "dashed",
                        paddingVertical: 20,
                        gap: 8,
                      }}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={COLORS.textTertiary}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: COLORS.textTertiary,
                          fontWeight: "500",
                        }}
                      >
                        Add steps
                      </Text>
                    </Pressable>
                  </View>
                </>
              );
            }

            return (
              <>
                {morningSteps.length > 0 && (
                  <>
                    <SectionDivider label="Morning Routine" />
                    <View className="gap-3">
                      {morningSteps.map((step, index: number) =>
                        renderStepCard(step, index, selectedCustomRoutine),
                      )}
                    </View>
                  </>
                )}
                {eveningSteps.length > 0 && (
                  <>
                    <SectionDivider label="Evening Routine" />
                    <View className="gap-3">
                      {eveningSteps.map((step, index: number) =>
                        renderStepCard(step, index, selectedCustomRoutine),
                      )}
                    </View>
                  </>
                )}
                {untaggedSteps.length > 0 && (
                  <>
                    <SectionDivider
                      label={selectedCustomRoutine.name || "Custom Routine"}
                    />
                    <View className="gap-3">
                      {untaggedSteps.map((step, index: number) =>
                        renderStepCard(step, index, selectedCustomRoutine),
                      )}
                    </View>
                  </>
                )}
                {allSteps.length > 0 &&
                  !allSteps.every((s) => s.isCompleted) && (
                    <Pressable
                      onPress={() =>
                        handleCompleteRoutine(selectedCustomRoutine.id)
                      }
                      disabled={completeRoutine.isPending}
                      style={{
                        backgroundColor: COLORS.primary,
                        borderRadius: 999,
                        paddingVertical: 14,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#fff"
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: "#fff",
                          fontFamily: "SFProRounded_Bold",
                        }}
                      >
                        Done
                      </Text>
                    </Pressable>
                  )}
              </>
            );
          })()
        ) : null}

        {selectedRoutineId === "default" &&
          amSteps.length === 0 &&
          pmSteps.length === 0 &&
          customRoutines.length === 0 &&
          !isLoading && (
            <View className="items-center py-[60px]">
              <Text className="text-[48px] mb-4">✨</Text>
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

      <AddProductSheet
        ref={productSelectSheetRef}
        onSelect={handleProductSelect}
      />

      <ActionMenu
        ref={actionSheetRef}
        title={headerTitle}
        subtitle="What would you like to do?"
        groups={actionGroups}
      />

      <XpToast
        xp={50}
        visible={xpToastVisible}
        onHide={() => setXpToastVisible(false)}
      />

      {deleteRoutine.isPending && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              gap: 12,
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text
              style={{ fontSize: 15, fontWeight: "500", color: COLORS.text }}
            >
              Deleting routine…
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
