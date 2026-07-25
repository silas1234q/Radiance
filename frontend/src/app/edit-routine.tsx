import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoutines, useDeleteStep, useUpdateStep, useUpdateRoutine } from '../hooks/queries/useRoutines';
import AddProductSheet, { type AddProductSheetRef } from '../components/routine/AddProductSheet';
import AddStepSheet, { type AddStepSheetRef } from '../components/routine/AddStepSheet';
import RoutineStepCard from '../components/routine/RoutineStepCard';
import RoutineReminderFields, { type RoutineReminderValue } from '../components/routine/RoutineReminderFields';
import CircleIconButton from '../components/ui/CircleIconButton';
import { COLORS } from '../constants/theme';

export default function EditRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();
  const { data: routines } = useRoutines();
  const deleteStep = useDeleteStep();
  const updateStep = useUpdateStep();
  const updateRoutine = useUpdateRoutine();

  const addStepSheetRef = useRef<AddStepSheetRef>(null);
  const addProductSheetRef = useRef<AddProductSheetRef>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const routine = routines?.find((r) => r.id === routineId);
  const steps = (routine?.steps ?? []).slice().sort((a, b) => a.order - b.order);

  // Reminder state, seeded from the routine and persisted on change.
  const [reminder, setReminder] = useState<RoutineReminderValue>({
    amReminderTime: null,
    pmReminderTime: null,
  });
  useEffect(() => {
    if (routine) {
      setReminder({
        amReminderTime: routine.amReminderTime ?? null,
        pmReminderTime: routine.pmReminderTime ?? null,
      });
    }
  }, [routine?.id, routine?.amReminderTime, routine?.pmReminderTime]);

  const handleReminderChange = useCallback(
    (next: RoutineReminderValue) => {
      setReminder(next);
      if (!routineId) return;
      updateRoutine.mutate({
        routineId,
        data: {
          reminderEnabled: !!(next.amReminderTime || next.pmReminderTime),
          amReminderTime: next.amReminderTime,
          pmReminderTime: next.pmReminderTime,
        },
      });
    },
    [routineId, updateRoutine],
  );

  const handleDeleteStep = useCallback((stepId: string, stepName: string) => {
    Alert.alert(
      'Remove Step',
      `Remove "${stepName}" from your routine?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteStep.mutate({ routineId: routineId!, stepId }),
        },
      ],
    );
  }, [deleteStep, routineId]);

  const handleImagePress = useCallback((stepId: string) => {
    setSelectedStepId(stepId);
    addProductSheetRef.current?.present();
  }, []);

  const handleProductSelect = useCallback((product: { id: string; name: string; brand: string; imageUrl?: string }) => {
    if (!selectedStepId || !routineId) return;
    updateStep.mutate({
      routineId,
      stepId: selectedStepId,
      data: { productId: product.id },
    });
    setSelectedStepId(null);
  }, [selectedStepId, routineId, updateStep]);

  if (!routine) {
    return (
      <View className="flex-1 bg-gray-200">
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-skin-text-secondary">Routine not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-200">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 mt-2 mb-5" style={{ height: 44 }}>
          <CircleIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text className="text-[18px] tracking-[-0.4px] text-skin-text" style={{ fontWeight: '600' }}>
            {routine.name || 'Custom Routine'}
          </Text>
          <CircleIconButton icon="add" onPress={() => addStepSheetRef.current?.present()} />
        </View>

        {/* Steps list */}
        <FlatList
          data={steps}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'SFProRounded_Semibold',
                  color: COLORS.textSecondary,
                  marginBottom: 6,
                }}
              >
                Reminders
              </Text>
              <RoutineReminderFields value={reminder} onChange={handleReminderChange} />
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <RoutineStepCard
                name={item.name}
                description={item.description}
                productName={item.product?.name}
                isCompleted={item.isCompleted}
                productImageUrl={item.product?.imageUrl}
                onImagePress={() => handleImagePress(item.id)}
                onToggle={() => {}}
              />
              <Pressable
                onPress={() => handleDeleteStep(item.id, item.name)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: COLORS.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <Ionicons name="remove" size={16} color="#fff" />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-[60px]">
              <Ionicons name="list-outline" size={48} color={COLORS.textTertiary} />
              <Text className="text-base text-skin-text-secondary text-center max-w-[240px] leading-[22px] mt-4">
                Tap + to add your first step
              </Text>
            </View>
          }
        />

        <AddStepSheet
          ref={addStepSheetRef}
          amRoutineId={routine.type === 'AM' ? routine.id : undefined}
          pmRoutineId={routine.type === 'PM' ? routine.id : undefined}
          customRoutineId={routine.type === 'CUSTOM' ? routine.id : undefined}
        />

        <AddProductSheet ref={addProductSheetRef} onSelect={handleProductSelect} />
      </SafeAreaView>
    </View>
  );
}
