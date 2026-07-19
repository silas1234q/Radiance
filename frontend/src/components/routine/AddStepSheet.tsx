import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { COLORS } from '../../constants/theme';
import { useAddStep } from '../../hooks/queries/useRoutines';

export type AddStepSheetRef = BottomSheetModal;

interface AddStepSheetProps {
  amRoutineId?: string;
  pmRoutineId?: string;
  customRoutineId?: string;
}

const AddStepSheet = forwardRef<BottomSheetModal, AddStepSheetProps>(
  ({ amRoutineId, pmRoutineId, customRoutineId }, ref) => {
    const innerRef = useRef<BottomSheetModal>(null);
    const addStep = useAddStep();

    const [selectedType, setSelectedType] = useState<'AM' | 'PM'>('AM');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useImperativeHandle(ref, () => innerRef.current as BottomSheetModal);

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      ),
      [],
    );

    const resetForm = useCallback(() => {
      setName('');
      setDescription('');
      setSelectedType('AM');
    }, []);

    const handleSubmit = useCallback(() => {
      const routineId = customRoutineId || (selectedType === 'AM' ? amRoutineId : pmRoutineId);
      if (!routineId || !name.trim()) return;

      addStep.mutate(
        { routineId, name: name.trim(), description: description.trim() || undefined },
        {
          onSuccess: () => {
            resetForm();
            innerRef.current?.dismiss();
          },
        },
      );
    }, [selectedType, amRoutineId, pmRoutineId, customRoutineId, name, description, addStep, resetForm]);

    const canSubmit = name.trim().length > 0 && (customRoutineId || (selectedType === 'AM' ? amRoutineId : pmRoutineId));

    return (
      <BottomSheetModal
        ref={innerRef}
        enableDynamicSizing
        onDismiss={resetForm}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#E0E0E0', width: 40, height: 5 }}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>Add Step</Text>
            <Pressable
              onPress={() => innerRef.current?.dismiss()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F2F2F7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color={COLORS.text} />
            </Pressable>
          </View>

          {/* Routine type selector (hidden for custom routines) */}
          {!customRoutineId && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {(['AM', 'PM'] as const).map((type) => {
                const isActive = selectedType === type;
                const hasRoutine = type === 'AM' ? !!amRoutineId : !!pmRoutineId;
                return (
                  <Pressable
                    key={type}
                    onPress={() => hasRoutine && setSelectedType(type)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: isActive ? COLORS.primary : '#F2F2F7',
                      opacity: hasRoutine ? 1 : 0.4,
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isActive ? '#fff' : COLORS.text,
                    }}>
                      {type === 'AM' ? 'Morning' : 'Evening'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Step name */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 }}>
            Step Name
          </Text>
          <BottomSheetTextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Apply sunscreen"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              fontSize: 15,
              color: COLORS.text,
              backgroundColor: '#F2F2F7',
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 46,
              marginBottom: 16,
            }}
          />

          {/* Description */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 }}>
            Description (optional)
          </Text>
          <BottomSheetTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Use SPF 50+, reapply every 2 hours"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              fontSize: 15,
              color: COLORS.text,
              backgroundColor: '#F2F2F7',
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 46,
              marginBottom: 24,
            }}
          />

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || addStep.isPending}
            style={{
              backgroundColor: canSubmit ? COLORS.primary : '#E0E0E0',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: canSubmit ? '#fff' : '#999' }}>
              {addStep.isPending ? 'Adding...' : 'Add Step'}
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default AddStepSheet;
