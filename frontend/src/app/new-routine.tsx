import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import CircleIconButton from '../components/ui/CircleIconButton';
import { useCreateCustomRoutine } from '../hooks/queries/useRoutines';
import RoutineReminderFields, {
  RoutineReminderValue,
} from '../components/routine/RoutineReminderFields';

export default function NewRoutineScreen() {
  const router = useRouter();
  const createRoutine = useCreateCustomRoutine();
  const [name, setName] = useState('');
  const [reminder, setReminder] = useState<RoutineReminderValue>({
    amReminderTime: null,
    pmReminderTime: null,
  });

  const canSubmit = name.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;

    const reminderEnabled = !!(reminder.amReminderTime || reminder.pmReminderTime);
    createRoutine.mutate(
      {
        name: name.trim(),
        reminderEnabled,
        amReminderTime: reminder.amReminderTime,
        pmReminderTime: reminder.pmReminderTime,
      },
      {
        onSuccess: (data) => {
          router.dismiss();
          router.push({ pathname: '/add-steps', params: { routineId: data.id } });
        },
      },
    );
  }, [name, reminder, createRoutine, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              height: 52,
            }}
          >
            <CircleIconButton icon="close" onPress={() => router.back()} />
            <Text
              style={{
                fontSize: 17,
                fontFamily: 'SFProRounded_Semibold',
                color: COLORS.text,
              }}
            >
              New Routine
            </Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Content */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'SFProRounded_Semibold',
                color: COLORS.textSecondary,
                marginBottom: 6,
              }}
            >
              Routine Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Weekly Mask Night"
              placeholderTextColor={COLORS.textTertiary}
              autoFocus
              style={{
                fontSize: 15,
                fontFamily: 'SFProRounded_Regular',
                color: COLORS.text,
                backgroundColor: '#fff',
                borderRadius: 14,
                paddingHorizontal: 14,
                height: 46,
                marginBottom: 24,
              }}
            />

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
            <View style={{ marginBottom: 24 }}>
              <RoutineReminderFields value={reminder} onChange={setReminder} />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || createRoutine.isPending}
              style={{
                backgroundColor: canSubmit ? COLORS.primary : '#E0E0E0',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 50,
                // Dim the button while the create request is in flight.
                opacity: createRoutine.isPending ? 0.6 : 1,
              }}
            >
              {createRoutine.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'SFProRounded_Semibold',
                    color: canSubmit ? '#fff' : '#999',
                  }}
                >
                  Create
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
