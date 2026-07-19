import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useCreateCustomRoutine } from '../hooks/queries/useRoutines';

export default function NewRoutineScreen() {
  const router = useRouter();
  const createRoutine = useCreateCustomRoutine();
  const [name, setName] = useState('');

  const canSubmit = name.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;

    createRoutine.mutate(
      { name: name.trim() },
      {
        onSuccess: (data) => {
          router.replace({ pathname: '/add-steps', params: { routineId: data.id } });
        },
      },
    );
  }, [name, createRoutine, router]);

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
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color={COLORS.text} />
            </Pressable>
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

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || createRoutine.isPending}
              style={{
                backgroundColor: canSubmit ? COLORS.primary : '#E0E0E0',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'SFProRounded_Semibold',
                  color: canSubmit ? '#fff' : '#999',
                }}
              >
                {createRoutine.isPending ? 'Creating...' : 'Create'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
