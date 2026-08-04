import React, { useRef, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  useRoutines,
  useAddStep,
  useUpdateStep,
  useToggleStep,
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
import CircleIconButton from "../../components/ui/CircleIconButton";
import ActionMenu, {
  type ActionMenuGroup,
} from "../../components/ui/ActionMenu";
import TimePickerSheet from "../../components/routine/TimePickerSheet";
import FrequencyPickerSheet from "../../components/routine/FrequencyPickerSheet";
import { COLORS } from "../../constants/theme";
import type { Routine, RoutineStep } from "../../types/api";

function getProductDescription(category?: string, brand?: string): string {
  if (!category) return brand ? `By ${brand}` : 'Custom skincare step';
  const cat = category.toLowerCase();
  if (cat.includes('cleanser') || cat.includes('wash') || cat.includes('cleansing')) return 'Cleanse & refresh your skin';
  if (cat.includes('moisturizer') || cat.includes('cream') || cat.includes('lotion')) return 'Hydrate & nourish your skin';
  if (cat.includes('sunscreen') || cat.includes('spf')) return 'Shield from UV damage';
  if (cat.includes('serum')) return 'Target specific concerns';
  if (cat.includes('toner')) return 'Balance & prep your skin';
  if (cat.includes('mask')) return 'Deep treatment for your skin';
  if (cat.includes('eye')) return 'Nourish the eye area';
  if (cat.includes('exfoli') || cat.includes('scrub') || cat.includes('peel')) return 'Smooth & renew your skin';
  return brand ? `By ${brand}` : 'Custom skincare step';
}

export default function RoutineScreen() {
  const router = useRouter();
  const addSheetRef = useRef<AddProductSheetRef>(null);
  const actionSheetRef = useRef<BottomSheetModal>(null);
  const productSelectSheetRef = useRef<AddProductSheetRef>(null);
  const timePickerRef = useRef<BottomSheetModal>(null);
  const frequencyPickerRef = useRef<BottomSheetModal>(null);
  const openAddSheet = useCallback(() => addSheetRef.current?.present(), []);
  const { data: routines, isLoading, isFetching } = useRoutines();
  const { data: skinProfile } = useSkinProfile();
  const { data: weeklyCompletions } = useWeeklyCompletions();
  const [xpToastVisible, setXpToastVisible] = useState(false);


  const addStep = useAddStep();
  const updateStep = useUpdateStep();
  const toggleStep = useToggleStep();
  const deleteRoutine = useDeleteRoutine();
  const completeRoutine = useCompleteRoutine();

  const [pendingAddProduct, setPendingAddProduct] = useState<{
    id: string; name: string; brand: string; imageUrl?: string; category?: string;
  } | null>(null);
  const [pendingAddSection, setPendingAddSection] = useState<'morning' | 'evening' | null>(null);

  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("default");

  // When navigated here with a `selectedId` (e.g. right after creating a custom
  // routine), open that routine instead of the default one.
  const { selectedId } = useLocalSearchParams<{ selectedId?: string }>();
  useEffect(() => {
    if (selectedId) setSelectedRoutineId(selectedId);
  }, [selectedId]);

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

  // A custom routine keeps its morning/evening steps in a single routine (tagged
  // [AM]/[PM]), so "complete this section" means toggling that section's
  // still-incomplete steps rather than completing the whole routine.
  const handleCompleteSteps = useCallback(
    async (routineId: string, steps: RoutineStep[]) => {
      const pending = steps.filter((s) => !s.isCompleted);
      if (pending.length === 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        for (const step of pending) {
          await toggleStep.mutateAsync({ routineId, stepId: step.id });
        }
        setXpToastVisible(true);
      } catch {
        // Optimistic changes are rolled back inside the mutation on error.
      }
    },
    [toggleStep],
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

  // ─── Add product as step flow: product → time → frequency → create ───
  const handleAddProductSelect = useCallback(
    (product: { id: string; name: string; brand: string; imageUrl?: string; category?: string }) => {
      setPendingAddProduct(product);
      setTimeout(() => timePickerRef.current?.present(), 300);
    },
    [],
  );

  const handleTimeSelect = useCallback(
    (section: 'morning' | 'evening') => {
      if (!pendingAddProduct) return;
      setPendingAddSection(section);
      setTimeout(() => frequencyPickerRef.current?.present(), 300);
    },
    [pendingAddProduct],
  );

  const handleFrequencySelect = useCallback(
    (frequency: string) => {
      if (!pendingAddProduct || !pendingAddSection) return;
      const section = pendingAddSection;
      // For the default view, pick the AM or PM routine; for custom, use the selected routine
      const targetRoutineId =
        selectedRoutineId === 'default'
          ? section === 'morning'
            ? amRoutine?.id
            : pmRoutine?.id
          : selectedRoutineId;
      if (!targetRoutineId) return;

      const desc = getProductDescription(pendingAddProduct.category, pendingAddProduct.brand);
      const sectionTag = section === 'morning' ? '[AM]' : '[PM]';

      addStep.mutate({
        routineId: targetRoutineId,
        name: pendingAddProduct.name,
        description: `${sectionTag} ${desc} · ${frequency}`,
        productId: pendingAddProduct.id,
      });
      setPendingAddProduct(null);
      setPendingAddSection(null);
    },
    [pendingAddProduct, pendingAddSection, selectedRoutineId, amRoutine, pmRoutine, addStep],
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

  const renderDoneButton = (onPress: () => void) => (
    <Pressable
      onPress={onPress}
      disabled={completeRoutine.isPending || toggleStep.isPending}
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
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
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
            <CircleIconButton icon="ellipsis-horizontal" onPress={openActionSheet} />
            <CircleIconButton icon="add" onPress={() => openAddSheet()} />
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
        {insightLoading && hasStepsWithProducts && <InsightSkeleton />}
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
            {amSteps.length > 0 && <SectionDivider label="Morning Routine" />}
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
            {pmSteps.length > 0 && <SectionDivider label="Evening Routine" />}
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
                    {!morningSteps.every((s) => s.isCompleted) &&
                      renderDoneButton(() =>
                        handleCompleteSteps(
                          selectedCustomRoutine.id,
                          morningSteps,
                        ),
                      )}
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
                    {!eveningSteps.every((s) => s.isCompleted) &&
                      renderDoneButton(() =>
                        handleCompleteSteps(
                          selectedCustomRoutine.id,
                          eveningSteps,
                        ),
                      )}
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
                    {!untaggedSteps.every((s) => s.isCompleted) &&
                      renderDoneButton(() =>
                        handleCompleteSteps(
                          selectedCustomRoutine.id,
                          untaggedSteps,
                        ),
                      )}
                  </>
                )}
              </>
            );
          })()
        ) : null}

        {selectedRoutineId === "default" &&
          amSteps.length === 0 &&
          pmSteps.length === 0 &&
          !isLoading && (
            <View className="items-center py-[60px]">
              <Ionicons name="sparkles" size={48} color="#F06680" style={{ marginBottom: 16 }} />
              <Text className="text-base text-skin-text-secondary text-center max-w-[260px] leading-[22px] mb-5">
                Scan your skin to unlock a personalized routine
              </Text>
              <Pressable
                onPress={() => router.push("/(onboarding)/face-scan")}
                className="flex-row items-center h-[48px] px-6 rounded-full bg-primary"
                style={({ pressed }) => [pressed && { opacity: 0.85 }]}
              >
                <Ionicons
                  name="scan-outline"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-[15px] font-poppins-semibold text-white">
                  Scan My Skin
                </Text>
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Medium', color: COLORS.textTertiary }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              </View>

              <Pressable
                onPress={() => router.push("/new-routine")}
                className="flex-row items-center h-[48px] px-6 rounded-full"
                style={({ pressed }) => [{
                  borderWidth: 1.5,
                  borderColor: COLORS.border,
                  backgroundColor: '#fff',
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={COLORS.text}
                  style={{ marginRight: 8 }}
                />
                <Text className="text-[15px] font-poppins-semibold text-skin-text">
                  Create Custom Routine
                </Text>
              </Pressable>
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

      <AddProductSheet ref={addSheetRef} onSelect={handleAddProductSelect} />

      <AddProductSheet
        ref={productSelectSheetRef}
        onSelect={handleProductSelect}
      />

      <TimePickerSheet ref={timePickerRef} onSelect={handleTimeSelect} />
      <FrequencyPickerSheet ref={frequencyPickerRef} onSelect={handleFrequencySelect} />

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
    </SafeAreaView>
  );
}
