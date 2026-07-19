import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRoutines, useAddStep, useDeleteStep, useUpdateStep } from '../hooks/queries/useRoutines';
import AddProductSheet, { type AddProductSheetRef } from '../components/routine/AddProductSheet';
import AddStepSheet, { type AddStepSheetRef } from '../components/routine/AddStepSheet';
import RoutineStepCard from '../components/routine/RoutineStepCard';
import GlassIconButton from '../components/ui/GlassIconButton';
import { COLORS } from '../constants/theme';

export default function EditRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();
  const { data: routines } = useRoutines();
  const deleteStep = useDeleteStep();
  const updateStep = useUpdateStep();

  const addStepSheetRef = useRef<AddStepSheetRef>(null);
  const addProductSheetRef = useRef<AddProductSheetRef>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const routine = routines?.find((r) => r.id === routineId);
  const steps = (routine?.steps ?? []).slice().sort((a, b) => a.order - b.order);

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
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} size={38} iconSize={20} />
          <Text className="text-[18px] tracking-[-0.4px] text-skin-text" style={{ fontWeight: '600' }}>
            {routine.name || 'Custom Routine'}
          </Text>
          <GlassIconButton icon="add" onPress={() => addStepSheetRef.current?.present()} size={38} iconSize={22} />
        </View>

        {/* Steps list */}
        <FlatList
          data={steps}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
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
