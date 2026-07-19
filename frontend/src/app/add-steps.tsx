import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, useAnimatedProps, useAnimatedReaction, FadeIn, FadeInDown, FadeOut, runOnJS } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Swipeable } from 'react-native-gesture-handler';
import { useQueryClient } from '@tanstack/react-query';
import { useRoutines, useAddStep, useUpdateStep, useDeleteStep, useReorderSteps, useDetailedInsight } from '../hooks/queries/useRoutines';
import AddProductSheet, { type AddProductSheetRef } from '../components/routine/AddProductSheet';
import DraggableStepList from '../components/routine/DraggableStepList';
import GlassIconButton from '../components/ui/GlassIconButton';
import TimePickerSheet from '../components/routine/TimePickerSheet';
import FrequencyPickerSheet from '../components/routine/FrequencyPickerSheet';
import { COLORS } from '../constants/theme';
import type { Routine } from '../types/api';

interface StepTemplate {
  name: string;
  description: string;
}

const MORNING_STEPS: StepTemplate[] = [
  { name: 'Cleanser', description: 'Cleanse away impurities' },
  { name: 'Moisturizer', description: 'Hydrate your skin' },
  { name: 'Sunscreen', description: 'Protect from UV damage' },
];

const EVENING_STEPS: StepTemplate[] = [
  { name: 'Cleanser', description: 'Remove makeup & dirt' },
  { name: 'Serum', description: 'Target specific concerns' },
  { name: 'Moisturizer', description: 'Nourish overnight' },
];

interface AddedStep {
  templateKey: string;
  stepId: string;
  routineId: string;
  hasProduct: boolean;
  productId?: string;
  productName?: string;
  productImageUrl?: string;
  stepName?: string;
  description?: string;
  section: 'morning' | 'evening';
}

function stripSectionTag(desc: string): string {
  return desc.replace(/^\[(AM|PM)\]\s*/, '');
}

function getProductDescription(category?: string, brand?: string): string {
  if (!category) return brand ? `By ${brand}` : 'Custom skincare step';
  const cat = category.toLowerCase();
  if (cat.includes('cleanser') || cat.includes('wash') || cat.includes('cleansing')) return 'Cleanse & refresh your skin';
  if (cat.includes('moisturizer') || cat.includes('cream') || cat.includes('lotion')) return 'Hydrate & nourish your skin';
  if (cat.includes('sunscreen') || cat.includes('spf')) return 'Shield from UV damage';
  if (cat.includes('serum') || cat.includes('essence')) return 'Target specific skin concerns';
  if (cat.includes('toner')) return 'Balance & prep your skin';
  if (cat.includes('exfoliant') || cat.includes('scrub') || cat.includes('peel')) return 'Remove dead skin cells';
  if (cat.includes('mask')) return 'Deep treatment for your skin';
  if (cat.includes('eye')) return 'Care for the delicate eye area';
  if (cat.includes('oil')) return 'Nourish & seal in moisture';
  return brand ? `${category} by ${brand}` : category;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AnimatedScoreCircle({ score, size = 52, strokeWidth = 3 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedScore = useSharedValue(score);
  const animatedProgress = useSharedValue((score / 100) * circumference);
  const scale = useSharedValue(1);
  const [displayScore, setDisplayScore] = useState(score);

  useAnimatedReaction(
    () => Math.round(animatedScore.value),
    (current) => { runOnJS(setDisplayScore)(current); },
  );

  useEffect(() => {
    // Trigger a subtle pop animation
    scale.value = withSpring(1.08, { damping: 8, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
    });
    animatedScore.value = withTiming(score, { duration: 600, easing: Easing.out(Easing.cubic) });
    animatedProgress.value = withTiming((score / 100) * circumference, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [score]);

  const color = score >= 70 ? '#4CAF50' : score >= 50 ? '#FF9800' : '#F44336';
  const textColor = score >= 70 ? '#2E7D32' : score >= 50 ? '#E65100' : '#C62828';

  const circleAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: [animatedProgress.value, circumference - animatedProgress.value],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color + '40'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          animatedProps={circleAnimatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Bold', color: textColor }}>
          {displayScore}
        </Text>
      </View>
    </Animated.View>
  );
}

// Which flow triggered the product sheet
type ProductFlow =
  | { type: 'step'; key: string; name: string; description: string }
  | { type: 'add'; product?: { id: string; name: string; brand: string; imageUrl?: string } };

export default function AddStepsScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { data: routines } = useRoutines();
  const queryClient = useQueryClient();
  const addStep = useAddStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();
  const reorderSteps = useReorderSteps();
  const reorderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sheets
  const stepProductSheetRef = useRef<AddProductSheetRef>(null);
  const addProductSheetRef = useRef<AddProductSheetRef>(null);
  const timePickerRef = useRef<BottomSheetModal>(null);
  const frequencyPickerRef = useRef<BottomSheetModal>(null);

  const firstName = user?.firstName || '';
  const routine = routines?.find((r) => r.id === routineId);
  const amRoutineData = routines?.find((r) => r.type === 'AM');
  const pmRoutineData = routines?.find((r) => r.type === 'PM');
  const isDefaultRoutine = routine?.type === 'AM' || routine?.type === 'PM';

  // Resolve correct routine ID for a given section
  const getRoutineIdForSection = useCallback((section: 'morning' | 'evening'): string | undefined => {
    if (!isDefaultRoutine) return routineId;
    return section === 'morning' ? amRoutineData?.id : pmRoutineData?.id;
  }, [isDefaultRoutine, routineId, amRoutineData, pmRoutineData]);

  const [addedSteps, setAddedSteps] = useState<AddedStep[]>([]);
  const [initializedRoutineId, setInitializedRoutineId] = useState<string | null>(null);
  const [flow, setFlow] = useState<ProductFlow | null>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  // Temporarily hold the selected product from the "add" flow until time-of-day is chosen
  const [pendingAddProduct, setPendingAddProduct] = useState<{
    id: string; name: string; brand: string; imageUrl?: string; category?: string;
  } | null>(null);
  // Temporarily hold the selected product from the "step" flow until frequency is chosen
  const [pendingStepProduct, setPendingStepProduct] = useState<{
    id: string; name: string; brand: string; imageUrl?: string; category?: string;
  } | null>(null);
  // For custom step flow: hold section chosen in time picker until frequency is picked
  const [pendingAddSection, setPendingAddSection] = useState<'morning' | 'evening' | null>(null);

  // Track pending step creation promises so handleFrequencySelect can wait for the real stepId
  const pendingStepResolvers = useRef<Map<string, { promise: Promise<string>; resolve: (id: string) => void }>>(new Map());

  // Use the same detailed insight hook as routine screen & insight screen
  const hasProducts = addedSteps.some((s) => s.hasProduct);
  const { data: insightData, isLoading: insightLoading, isFetching: insightFetching } = useDetailedInsight(routineId, hasProducts);
  const isRefetching = insightFetching && !insightLoading && !!insightData;

  // Seed addedSteps from existing routine data on mount / when routines load
  useEffect(() => {
    if (!routines || !routineId || initializedRoutineId === routineId) return;

    const seedFromRoutine = (r: Routine, section: 'morning' | 'evening'): AddedStep[] => {
      const steps = r?.steps ?? [];
      if (steps.length === 0) return [];
      const templates = section === 'morning' ? MORNING_STEPS : EVENING_STEPS;
      const usedTemplateIndices = new Set<number>();
      return steps.map((step) => {
        const stepName = (step.name ?? '').toLowerCase();
        const templateIndex = templates.findIndex(
          (t, idx) => {
            if (usedTemplateIndices.has(idx)) return false;
            const tName = t.name.toLowerCase();
            return stepName === tName || stepName.includes(tName) || tName.includes(stepName);
          },
        );
        if (templateIndex >= 0) usedTemplateIndices.add(templateIndex);
        const key =
          templateIndex >= 0
            ? `${section}-${templateIndex}`
            : `${section}-added-${step.id}`;
        return {
          templateKey: key,
          stepId: step.id,
          routineId: r.id,
          hasProduct: !!step.product,
          productId: step.product?.id,
          productName: step.product?.name,
          productImageUrl: step.product?.imageUrl,
          stepName: step.name,
          description: step.description || (step.product ? getProductDescription(step.product.category, step.product.brand) : undefined),
          section,
        };
      });
    };

    const amRoutine = routines.find((r) => r.type === 'AM');
    const pmRoutine = routines.find((r) => r.type === 'PM');
    const isDefault = routine?.type === 'AM' || routine?.type === 'PM';

    let seeded: AddedStep[] = [];
    if (isDefault) {
      seeded = [
        ...seedFromRoutine(amRoutine, 'morning'),
        ...seedFromRoutine(pmRoutine, 'evening'),
      ];
    } else if (routine) {
      const steps = routine?.steps ?? [];
      seeded = steps.map((step) => {
        const section: 'morning' | 'evening' =
          step.description?.startsWith('[PM]') ? 'evening' : 'morning';
        const templates = section === 'morning' ? MORNING_STEPS : EVENING_STEPS;
        const stepName = (step.name ?? '').toLowerCase();
        const templateIndex = templates.findIndex((t) => {
          const tName = t.name.toLowerCase();
          return stepName === tName || stepName.includes(tName) || tName.includes(stepName);
        });
        const key = templateIndex >= 0
          ? `${section}-${templateIndex}`
          : `${section}-added-${step.id}`;
        return {
          templateKey: key,
          stepId: step.id,
          routineId: routine.id,
          hasProduct: !!step.product,
          productId: step.product?.id,
          productName: step.product?.name,
          productImageUrl: step.product?.imageUrl,
          stepName: step.name,
          description: step.description || (step.product ? getProductDescription(step.product.category, step.product.brand) : undefined),
          section,
        };
      });
    }

    if (seeded.length > 0) {
      setAddedSteps(seeded);
    }
    setInitializedRoutineId(routineId);
  }, [routines, routine, routineId, initializedRoutineId]);

  // ─── Flow 1: Header "+" button ───────────────────────────────
  const handleAddButtonPress = useCallback(() => {
    setFlow({ type: 'add' });
    addProductSheetRef.current?.present();
  }, []);

  const handleAddProductSelect = useCallback(
    (product: { id: string; name: string; brand: string; imageUrl?: string; category?: string }) => {
      setPendingAddProduct(product);
      // Show time-of-day picker
      setTimeout(() => timePickerRef.current?.present(), 300);
    },
    [],
  );

  const handleTimeSelect = useCallback(
    (section: 'morning' | 'evening') => {
      if (!pendingAddProduct) return;
      setPendingAddSection(section);
      // Show frequency picker before creating the step
      setTimeout(() => frequencyPickerRef.current?.present(), 300);
    },
    [pendingAddProduct],
  );

  const handleAddFrequencySelect = useCallback(
    (frequency: string) => {
      if (!pendingAddProduct || !pendingAddSection) return;
      const section = pendingAddSection;
      const targetRoutineId = getRoutineIdForSection(section);
      if (!targetRoutineId) return;

      const desc = getProductDescription(pendingAddProduct.category, pendingAddProduct.brand);
      const sectionTag = section === 'morning' ? '[AM]' : '[PM]';

      addStep.mutate(
        {
          routineId: targetRoutineId,
          name: pendingAddProduct.name,
          description: `${sectionTag} ${desc} · ${frequency}`,
          productId: pendingAddProduct.id,
        },
        {
          onSuccess: (data) => {
            const key = `${section}-added-${Date.now()}`;
            const newStep: AddedStep = {
              templateKey: key,
              stepId: data.id,
              routineId: targetRoutineId,
              hasProduct: true,
              productId: pendingAddProduct.id,
              productName: pendingAddProduct.name,
              productImageUrl: pendingAddProduct.imageUrl,
              stepName: pendingAddProduct.name,
              description: `${sectionTag} ${desc} · ${frequency}`,
              section,
            };
            setAddedSteps((prev) => [...prev, newStep]);
            setPendingAddProduct(null);
            setPendingAddSection(null);
            setFlow(null);
          },
        },
      );
    },
    [pendingAddProduct, pendingAddSection, getRoutineIdForSection, addStep],
  );


  // ─── Flow 2: Step row tap ────────────────────────────────────
  const handleStepPress = useCallback(
    (section: string, index: number, template: StepTemplate) => {
      const key = `${section}-${index}`;
      const existing = addedSteps.find((s) => s.templateKey === key);

      if (existing) {
        setFlow({ type: 'step', key, name: template.name, description: template.description });
        stepProductSheetRef.current?.present();
        return;
      }

      const targetRoutineId = getRoutineIdForSection(section as 'morning' | 'evening');
      if (!targetRoutineId) return;

      // Open the sheet IMMEDIATELY with a pending placeholder
      const pendingId = `pending-${Date.now()}`;
      setAddedSteps((prev) => [
        ...prev,
        { templateKey: key, stepId: pendingId, routineId: targetRoutineId, hasProduct: false, stepName: template.name, section: section as 'morning' | 'evening' },
      ]);
      setFlow({ type: 'step', key, name: template.name, description: template.description });
      stepProductSheetRef.current?.present();

      // Create the step in the background; track a promise so downstream handlers can await the real ID
      let resolveFn: (id: string) => void;
      const promise = new Promise<string>((resolve) => { resolveFn = resolve; });
      pendingStepResolvers.current.set(key, { promise, resolve: resolveFn! });

      const sectionTag = section === 'morning' ? '[AM]' : '[PM]';
      addStep.mutate(
        { routineId: targetRoutineId, name: template.name, description: `${sectionTag} ${template.description}` },
        {
          onSuccess: (data) => {
            setAddedSteps((prev) =>
              prev.map((s) => (s.stepId === pendingId ? { ...s, stepId: data.id } : s)),
            );
            pendingStepResolvers.current.get(key)?.resolve(data.id);
            pendingStepResolvers.current.delete(key);
          },
        },
      );
    },
    [getRoutineIdForSection, addStep, addedSteps],
  );

  const handleStepProductSelect = useCallback(
    (product: { id: string; name: string; brand: string; imageUrl?: string; category?: string }) => {
      setPendingStepProduct(product);
      // Show frequency picker
      setTimeout(() => frequencyPickerRef.current?.present(), 300);
    },
    [],
  );

  const handleFrequencySelect = useCallback(
    async (frequency: string) => {
      if (!flow || flow.type !== 'step' || !pendingStepProduct) return;
      const added = addedSteps.find((s) => s.templateKey === flow.key);
      if (!added) return;

      // If the step is still being created, wait for the real ID
      let stepId = added.stepId;
      if (stepId.startsWith('pending-')) {
        const pending = pendingStepResolvers.current.get(flow.key);
        if (pending) {
          stepId = await pending.promise;
        }
      }

      const desc = getProductDescription(pendingStepProduct.category, pendingStepProduct.brand);

      updateStep.mutate({
        routineId: added.routineId,
        stepId,
        data: { productId: pendingStepProduct.id },
      });

      const updated = addedSteps.map((s) =>
        s.templateKey === flow.key
          ? {
              ...s,
              stepId: stepId,
              hasProduct: true,
              productId: pendingStepProduct.id,
              productName: pendingStepProduct.name,
              productImageUrl: pendingStepProduct.imageUrl,
              description: `${desc} · ${frequency}`,
            }
          : s,
      );
      setAddedSteps(updated);
      setPendingStepProduct(null);
      setFlow(null);
    },
    [flow, pendingStepProduct, addedSteps, updateStep],
  );

  const handleRemoveStep = useCallback(
    (key: string) => {
      const step = addedSteps.find((s) => s.templateKey === key);
      if (!step) return;

      if (step.stepId.startsWith('pending-')) {
        // Step still being created — wait for it, then delete
        const pending = pendingStepResolvers.current.get(key);
        if (pending) {
          pending.promise.then((realId) => {
            deleteStep.mutate({ routineId: step.routineId, stepId: realId });
          });
          pendingStepResolvers.current.delete(key);
        }
      } else {
        deleteStep.mutate({ routineId: step.routineId, stepId: step.stepId });
      }
      setAddedSteps((prev) => prev.filter((s) => s.templateKey !== key));
    },
    [addedSteps, deleteStep],
  );

  const handleFrequencyDispatch = useCallback(
    (label: string) => {
      if (flow?.type === 'add' || pendingAddSection) {
        handleAddFrequencySelect(label);
      } else {
        handleFrequencySelect(label);
      }
    },
    [flow, pendingAddSection, handleAddFrequencySelect, handleFrequencySelect],
  );


  // ─── Render ──────────────────────────────────────────────────
  const renderDeleteAction = (key: string) => {
    return (
      <Pressable
        onPress={() => {
          swipeableRefs.current.get(key)?.close();
          handleRemoveStep(key);
        }}
        style={{
          backgroundColor: '#FF3B30',
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
          borderRadius: 16,
          marginBottom: 10,
          marginLeft: 8,
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={{ fontSize: 11, fontFamily: 'SFProRounded_Medium', color: '#fff', marginTop: 2 }}>
          Delete
        </Text>
      </Pressable>
    );
  };

  const renderStepRow = (
    template: StepTemplate,
    index: number,
    section: string,
    displayIndex?: number,
  ) => {
    const key = `${section}-${index}`;
    const added = addedSteps.find((s) => s.templateKey === key);
    const hasProduct = added?.hasProduct ?? false;

    return (
      <Swipeable
        key={key}
        ref={(ref) => { if (ref) swipeableRefs.current.set(key, ref); }}
        renderRightActions={() => renderDeleteAction(key)}
        overshootRight={false}
        friction={2}
      >
        <Pressable
          onPress={() => handleStepPress(section, index, template)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 18,
            marginBottom: 10,
          }}
        >
          {/* Product image / plus icon */}
          {hasProduct && added?.productImageUrl ? (
            <Image
              source={{ uri: added.productImageUrl }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                marginRight: 14,
                backgroundColor: '#F2F2F7',
              }}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: COLORS.borderLight,
                borderStyle: 'dashed',
                backgroundColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons
                name={added ? 'add' : 'image-outline'}
                size={20}
                color={added ? COLORS.primary : COLORS.textTertiary}
              />
            </View>
          )}

          {/* Text content */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'SFProRounded_Medium',
                color: COLORS.textTertiary,
                letterSpacing: 0.2,
              }}
            >
              {hasProduct ? template.name : added ? 'Tap to add product' : 'Add product'}
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'SFProRounded_Semibold',
                color: COLORS.text,
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {hasProduct ? added?.productName : (added?.stepName || template.name)}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'SFProRounded_Regular',
                color: COLORS.textSecondary,
                marginTop: 1,
              }}
            >
              {hasProduct && added?.description ? stripSectionTag(added.description).split(' · ')[0] : (added?.description ? stripSectionTag(added.description) : template.description)}
            </Text>
            {hasProduct && added?.description && stripSectionTag(added.description).includes(' · ') && (
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'SFProRounded_Medium',
                  color: COLORS.primary,
                  marginTop: 2,
                }}
              >
                {stripSectionTag(added.description).split(' · ')[1]}
              </Text>
            )}
          </View>

          {/* Step number */}
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 10,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'SFProRounded_Medium',
                color: COLORS.textTertiary,
              }}
            >
              {(displayIndex ?? index) + 1}
            </Text>
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const renderCustomStepRow = (step: AddedStep, index: number) => {
    return (
      <Swipeable
        key={step.templateKey}
        ref={(ref) => { if (ref) swipeableRefs.current.set(step.templateKey, ref); }}
        renderRightActions={() => renderDeleteAction(step.templateKey)}
        overshootRight={false}
        friction={2}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 18,
            marginBottom: 10,
          }}
        >
          {step.productImageUrl ? (
            <Image
              source={{ uri: step.productImageUrl }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                marginRight: 14,
                backgroundColor: '#F2F2F7',
              }}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: COLORS.borderLight,
                borderStyle: 'dashed',
                backgroundColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons name="flask-outline" size={18} color={COLORS.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontFamily: 'SFProRounded_Medium', color: COLORS.textTertiary, letterSpacing: 0.2 }}>
              {step.stepName || 'Custom step'}
            </Text>
            <Text style={{ fontSize: 15, fontFamily: 'SFProRounded_Semibold', color: COLORS.text, marginTop: 1 }} numberOfLines={1}>
              {step.productName || step.stepName || 'Product'}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, marginTop: 1 }}>
              {step.description ? stripSectionTag(step.description).split(' · ')[0] : 'Custom skincare step'}
            </Text>
            {step.description && stripSectionTag(step.description).includes(' · ') && (
              <Text style={{ fontSize: 12, fontFamily: 'SFProRounded_Medium', color: COLORS.primary, marginTop: 2 }}>
                {stripSectionTag(step.description).split(' · ')[1]}
              </Text>
            )}
          </View>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Medium', color: COLORS.textTertiary }}>
              {index + 1}
            </Text>
          </View>
        </View>
      </Swipeable>
    );
  };

  // Custom-added steps per section
  const customMorningSteps = addedSteps.filter((s) => s.section === 'morning' && s.templateKey.includes('-added-'));
  const customEveningSteps = addedSteps.filter((s) => s.section === 'evening' && s.templateKey.includes('-added-'));

  // Unified step items for draggable lists
  type SectionItem = { type: 'template'; template: StepTemplate; index: number; section: string } | { type: 'custom'; step: AddedStep };

  const morningItems: SectionItem[] = [
    ...MORNING_STEPS.map((t, i) => ({ type: 'template' as const, template: t, index: i, section: 'morning' })),
    ...customMorningSteps.map((s) => ({ type: 'custom' as const, step: s })),
  ];

  const eveningItems: SectionItem[] = [
    ...EVENING_STEPS.map((t, i) => ({ type: 'template' as const, template: t, index: i, section: 'evening' })),
    ...customEveningSteps.map((s) => ({ type: 'custom' as const, step: s })),
  ];

  const [morningOrder, setMorningOrder] = useState<SectionItem[]>(morningItems);
  const [eveningOrder, setEveningOrder] = useState<SectionItem[]>(eveningItems);

  // Stable key for tracking addedSteps identity changes (seeding, additions, removals)
  const addedStepsKey = addedSteps.map((s) => s.templateKey).sort().join(',');

  // Debounced persist + re-analysis after reorder (2s delay to reduce API calls)
  const persistReorder = useCallback((items: SectionItem[], rId: string) => {
    const stepIds = items
      .map((item) => {
        if (item.type === 'template') {
          const key = `${item.section}-${item.index}`;
          return addedSteps.find((s) => s.templateKey === key)?.stepId;
        }
        return item.step.stepId;
      })
      .filter((id): id is string => !!id && !id.startsWith('pending-'));

    if (stepIds.length > 0) {
      reorderSteps.mutate({ routineId: rId, stepIds });
    }
  }, [addedSteps, reorderSteps]);

  const scheduleReorder = useCallback((morningItems: SectionItem[], eveningItems: SectionItem[]) => {
    if (reorderDebounceRef.current) clearTimeout(reorderDebounceRef.current);
    reorderDebounceRef.current = setTimeout(() => {
      if (routineId) {
        // Find the correct routine IDs for AM/PM
        const amRoutine = routines?.find((r) => r.type === 'AM');
        const pmRoutine = routines?.find((r) => r.type === 'PM');
        const isDefault = routine?.type === 'AM' || routine?.type === 'PM';

        if (isDefault) {
          if (amRoutine) persistReorder(morningItems, amRoutine.id);
          if (pmRoutine) persistReorder(eveningItems, pmRoutine.id);
        } else {
          persistReorder([...morningItems, ...eveningItems], routineId);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['routine-insight-detailed'] });
    }, 2000);
  }, [routineId, routines, routine, persistReorder, queryClient]);

  const handleMorningReorder = useCallback((newOrder: SectionItem[]) => {
    setMorningOrder(newOrder);
    setEveningOrder((ev) => { scheduleReorder(newOrder, ev); return ev; });
  }, [scheduleReorder]);

  const handleEveningReorder = useCallback((newOrder: SectionItem[]) => {
    setEveningOrder(newOrder);
    setMorningOrder((mo) => { scheduleReorder(mo, newOrder); return mo; });
  }, [scheduleReorder]);

  // Keep order in sync when addedSteps changes (seeding, additions, removals)
  useEffect(() => {
    setMorningOrder((prev) => {
      const prevKeys = new Set(prev.map((item) => item.type === 'template' ? `t-morning-${item.index}` : item.step.templateKey));
      const newItems = morningItems.filter((item) => {
        const key = item.type === 'template' ? `t-morning-${item.index}` : item.step.templateKey;
        return !prevKeys.has(key);
      });
      // Remove items no longer present
      const currentKeys = new Set(morningItems.map((item) => item.type === 'template' ? `t-morning-${item.index}` : item.step.templateKey));
      const filtered = prev.filter((item) => {
        const key = item.type === 'template' ? `t-morning-${item.index}` : item.step.templateKey;
        return currentKeys.has(key);
      });
      // Update custom step references so they reflect current addedSteps data
      const updatedFiltered = filtered.map((item) => {
        if (item.type === 'custom') {
          const fresh = customMorningSteps.find((s) => s.templateKey === item.step.templateKey);
          return fresh ? { ...item, step: fresh } : item;
        }
        return item;
      });
      return [...updatedFiltered, ...newItems];
    });
  }, [addedStepsKey]);

  useEffect(() => {
    setEveningOrder((prev) => {
      const prevKeys = new Set(prev.map((item) => item.type === 'template' ? `t-evening-${item.index}` : item.step.templateKey));
      const newItems = eveningItems.filter((item) => {
        const key = item.type === 'template' ? `t-evening-${item.index}` : item.step.templateKey;
        return !prevKeys.has(key);
      });
      const currentKeys = new Set(eveningItems.map((item) => item.type === 'template' ? `t-evening-${item.index}` : item.step.templateKey));
      const filtered = prev.filter((item) => {
        const key = item.type === 'template' ? `t-evening-${item.index}` : item.step.templateKey;
        return currentKeys.has(key);
      });
      // Update custom step references so they reflect current addedSteps data
      const updatedFiltered = filtered.map((item) => {
        if (item.type === 'custom') {
          const fresh = customEveningSteps.find((s) => s.templateKey === item.step.templateKey);
          return fresh ? { ...item, step: fresh } : item;
        }
        return item;
      });
      return [...updatedFiltered, ...newItems];
    });
  }, [addedStepsKey]);

  const sectionItemKey = (item: SectionItem) =>
    item.type === 'template' ? `t-${item.section}-${item.index}` : item.step.templateKey;

  const renderSectionItem = (item: SectionItem, idx: number) => {
    if (item.type === 'template') {
      return renderStepRow(item.template, item.index, item.section, idx);
    }
    return renderCustomStepRow(item.step, idx);
  };

  return (
    <View className="flex-1 bg-gray-200">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="relative items-center justify-center mt-2 mb-5" style={{ height: 44 }}>
            <Text className="text-[20px] tracking-[-0.4px] text-skin-text" style={{ fontWeight: '600' }}>
              {routine?.name || 'New Routine'}
            </Text>
            <View className="absolute left-0">
              <GlassIconButton icon="chevron-back" onPress={() => router.back()} size={38} iconSize={20} />
            </View>
            <View className="absolute right-0 flex-row items-center gap-2">
              <GlassIconButton icon="ellipsis-horizontal" onPress={() => {}} size={38} iconSize={20} />
              <GlassIconButton icon="add" onPress={handleAddButtonPress} size={38} iconSize={22} />
            </View>
          </View>

          {/* Welcome card */}
          <LinearGradient
            colors={['#FFF5F0', '#FFF0F3', '#F9F0FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              marginBottom: 28,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'SFProRounded_Semibold',
                color: COLORS.text,
                marginBottom: 6,
              }}
            >
              Hi{firstName ? ` ${firstName}` : ''}!
            </Text>
            {!insightData && !insightLoading && (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'SFProRounded_Medium',
                    color: COLORS.text,
                    lineHeight: 21,
                    marginBottom: 4,
                  }}
                >
                  Your skin transformation starts here.
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'SFProRounded_Regular',
                    color: COLORS.textSecondary,
                    lineHeight: 21,
                  }}
                >
                  Add your current products and we'll show you exactly what's
                  working (and what's not).
                </Text>
              </>
            )}
            {(insightLoading || insightData) && (
              <Animated.View entering={FadeInDown.duration(400).springify()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
                {insightLoading ? (
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      borderWidth: 3,
                      borderColor: COLORS.primary + '40',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : insightData && (
                  isRefetching ? (
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        borderWidth: 3,
                        borderColor: COLORS.primary + '40',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                  ) : (
                    <AnimatedScoreCircle score={insightData.compatibilityScore} />
                  )
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: 'SFProRounded_Semibold', color: COLORS.text }}>
                    {insightLoading ? 'Analyzing...' : 'Compatibility'}
                  </Text>
                  <Animated.Text
                    key={isRefetching ? 'refetching' : insightData?.summary}
                    entering={FadeIn.duration(300)}
                    style={{ fontSize: 12, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary }}
                    numberOfLines={2}
                  >
                    {insightLoading ? 'Checking product compatibility' : isRefetching ? 'Recalculating...' : insightData?.summary}
                  </Animated.Text>
                </View>
              </View>
              {/* Category scores as reasons */}
              {!insightLoading && insightData?.categoryScores && insightData.categoryScores.length > 0 && (
                <Animated.View style={{ marginTop: 12, gap: 6, opacity: isRefetching ? 0.5 : 1 }}>
                  {insightData.categoryScores.map((cat, i: number) => {
                    const sentiment = cat.score >= 70 ? 'positive' : cat.score >= 50 ? 'neutral' : 'negative';
                    const iconName =
                      sentiment === 'positive'
                        ? 'checkmark-circle'
                        : sentiment === 'negative'
                          ? 'close-circle'
                          : 'information-circle';
                    const iconColor =
                      sentiment === 'positive'
                        ? '#4CAF50'
                        : sentiment === 'negative'
                          ? '#F44336'
                          : '#9E9E9E';

                    return (
                      <Animated.View
                        key={`${cat.category}-${cat.score}`}
                        entering={FadeInDown.delay(i * 60).duration(250)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                      >
                        <Ionicons name={iconName} size={16} color={iconColor} />
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'SFProRounded_Regular',
                            color: COLORS.textSecondary,
                            flex: 1,
                          }}
                        >
                          {cat.category}: {cat.score}% — {cat.tip}
                        </Text>
                      </Animated.View>
                    );
                  })}
                </Animated.View>
              )}
              </Animated.View>
            )}
          </LinearGradient>

          {/* Morning section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
            <Text style={{ fontSize: 18, fontFamily: 'SFProRounded_Semibold', color: COLORS.text }}>
              Morning
            </Text>
            <Text style={{ fontSize: 16 }}>☀️</Text>
          </View>
          <DraggableStepList
            data={morningOrder}
            keyExtractor={sectionItemKey}
            renderItem={renderSectionItem}
            onReorder={handleMorningReorder}
          />

          {/* Evening section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 14, gap: 8 }}>
            <Text style={{ fontSize: 18, fontFamily: 'SFProRounded_Semibold', color: COLORS.text }}>
              Evening
            </Text>
            <Text style={{ fontSize: 16 }}>🌙</Text>
          </View>
          <DraggableStepList
            data={eveningOrder}
            keyExtractor={sectionItemKey}
            renderItem={renderSectionItem}
            onReorder={handleEveningReorder}
          />
        </ScrollView>

        {/* Save button */}
        <BlurView
          intensity={60}
          tint="light"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 }}
        >
          <Pressable
            onPress={() => {
              // Flush any pending reorder
              if (reorderDebounceRef.current) {
                clearTimeout(reorderDebounceRef.current);
                reorderDebounceRef.current = null;
              }
              queryClient.invalidateQueries({ queryKey: ['routines'] });
              queryClient.invalidateQueries({ queryKey: ['routine-insight-detailed'] });
              router.back();
            }}
            disabled={addStep.isPending || reorderSteps.isPending}
            style={({ pressed }) => ({
              backgroundColor: pressed ? COLORS.primary + '12' : '#fff',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (addStep.isPending || reorderSteps.isPending) ? 0.6 : 1,
            })}
          >
            {(addStep.isPending || reorderSteps.isPending) ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'SFProRounded_Semibold',
                  color: COLORS.primary,
                }}
              >
                {addedSteps.some((s) => s.hasProduct) ? 'Save Routine' : 'Done'}
              </Text>
            )}
          </Pressable>
        </BlurView>

        {/* Step flow: product sheet */}
        <AddProductSheet ref={stepProductSheetRef} onSelect={handleStepProductSelect} />

        {/* Add flow: product sheet */}
        <AddProductSheet ref={addProductSheetRef} onSelect={handleAddProductSelect} />

        {/* Time-of-day picker (for "+" add flow) */}
        <TimePickerSheet ref={timePickerRef} onSelect={handleTimeSelect} />

        {/* Frequency picker */}
        <FrequencyPickerSheet ref={frequencyPickerRef} onSelect={handleFrequencyDispatch} />
      </SafeAreaView>
    </View>
  );
}
