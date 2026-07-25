import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSkinProfile, useUpdateSkinProfile } from '../hooks/queries/useProfile';
import { COLORS } from '../constants/theme';
import CircleIconButton from '../components/ui/CircleIconButton';
import Button from '../components/ui/Button';
import QuestionCard from '../components/quiz/QuestionCard';
import ToneSwatches from '../components/quiz/ToneSwatches';

type FieldKey = 'skinType' | 'sensitivityLevel' | 'skinTone' | 'concerns' | 'allergies';

interface FieldConfig {
  title: string;
  subtitle: string;
  type: 'single' | 'multi' | 'tone' | 'text';
  options?: string[];
}

const FIELD_CONFIGS: Record<FieldKey, FieldConfig> = {
  skinType: {
    title: 'Skin Type',
    subtitle: 'Select the option that best describes your skin.',
    type: 'single',
    options: ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'],
  },
  sensitivityLevel: {
    title: 'Skin Sensitivity',
    subtitle: 'How sensitive is your skin to new products?',
    type: 'single',
    options: ['Very sensitive', 'Somewhat sensitive', 'Not sensitive'],
  },
  skinTone: {
    title: 'Skin Tone',
    subtitle: 'Select the tone closest to yours.',
    type: 'tone',
    options: ['Very fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark brown'],
  },
  concerns: {
    title: 'Skin Concerns',
    subtitle: 'Select all that apply. Your top concern will be your main skin goal.',
    type: 'multi',
    options: [
      'Acne', 'Dark spots', 'Redness', 'Uneven texture', 'Large pores',
      'Wrinkles', 'Fine lines', 'Dryness', 'Oiliness', 'Scarring', 'Dark circles',
    ],
  },
  allergies: {
    title: 'Allergies',
    subtitle: 'List any ingredient allergies, separated by commas.',
    type: 'text',
  },
};

export default function EditSkinFieldScreen() {
  const router = useRouter();
  const { field } = useLocalSearchParams<{ field: string }>();
  const { data: skinProfile } = useSkinProfile();
  const updateProfile = useUpdateSkinProfile();

  const fieldKey = field as FieldKey;
  const config = FIELD_CONFIGS[fieldKey];

  // Initialize state from current profile
  const getCurrentValue = (): string | string[] => {
    if (!skinProfile) return fieldKey === 'concerns' || fieldKey === 'allergies' ? [] : '';
    switch (fieldKey) {
      case 'skinType': return skinProfile.skinType || '';
      case 'sensitivityLevel': return skinProfile.sensitivityLevel || '';
      case 'skinTone': return skinProfile.skinTone || '';
      case 'concerns': return skinProfile.concerns ?? [];
      case 'allergies': return skinProfile.allergies ?? [];
      default: return '';
    }
  };

  const currentValue = getCurrentValue();
  const [selected, setSelected] = useState<string>(
    typeof currentValue === 'string' ? currentValue : ''
  );
  const [selectedMulti, setSelectedMulti] = useState<string[]>(
    Array.isArray(currentValue) ? currentValue : []
  );
  const [textValue, setTextValue] = useState<string>(
    Array.isArray(currentValue) ? currentValue.join(', ') : ''
  );

  if (!config) {
    router.back();
    return null;
  }

  const handleSave = () => {
    let data: Record<string, string | string[]> = {};

    switch (config.type) {
      case 'single':
        if (!selected) return;
        data[fieldKey] = selected;
        break;
      case 'tone':
        if (!selected) return;
        data[fieldKey] = selected;
        break;
      case 'multi':
        if (selectedMulti.length === 0) return;
        data[fieldKey] = selectedMulti;
        break;
      case 'text':
        data[fieldKey] = textValue
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
    }

    updateProfile.mutate(data, {
      onSuccess: () => router.back(),
    });
  };

  const toggleMulti = (option: string) => {
    setSelectedMulti((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const hasChanges = (): boolean => {
    switch (config.type) {
      case 'single':
      case 'tone':
        return selected !== (typeof currentValue === 'string' ? currentValue : '');
      case 'multi': {
        const curr = Array.isArray(currentValue) ? currentValue : [];
        return JSON.stringify(selectedMulti) !== JSON.stringify(curr);
      }
      case 'text': {
        const curr = Array.isArray(currentValue) ? currentValue.join(', ') : '';
        return textValue !== curr;
      }
      default:
        return false;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'whitesmoke' }}>
      <SafeAreaView className="flex-1 bg-transparent" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 12,
              gap: 14,
            }}
          >
            <CircleIconButton icon="chevron-back" onPress={() => router.back()} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text }}>
              {config.title}
            </Text>
          </View>

          {/* Subtitle */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={{ paddingHorizontal: 24, paddingBottom: 20 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '400', color: COLORS.textSecondary, lineHeight: 22 }}>
              {config.subtitle}
            </Text>
          </Animated.View>

          {/* Body */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              {config.type === 'single' && config.options?.map((option) => (
                <View key={option} style={{ marginBottom: 10 }}>
                  <QuestionCard
                    label={option}
                    selected={selected === option}
                    onPress={() => setSelected(option)}
                  />
                </View>
              ))}

              {config.type === 'multi' && config.options?.map((option) => (
                <View key={option} style={{ marginBottom: 10 }}>
                  <QuestionCard
                    label={option}
                    selected={selectedMulti.includes(option)}
                    onPress={() => toggleMulti(option)}
                  />
                </View>
              ))}

              {config.type === 'tone' && config.options && (
                <ToneSwatches
                  options={config.options}
                  selected={selected || null}
                  onSelect={setSelected}
                />
              )}

              {config.type === 'text' && (
                <TextInput
                  value={textValue}
                  onChangeText={setTextValue}
                  placeholder="e.g. Fragrance, Retinol, Niacinamide"
                  placeholderTextColor={COLORS.textTertiary}
                  multiline
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: 16,
                    fontSize: 16,
                    color: COLORS.text,
                    minHeight: 120,
                    textAlignVertical: 'top',
                    borderWidth: 1.5,
                    borderColor: COLORS.border,
                  }}
                />
              )}
            </Animated.View>
          </ScrollView>

          {/* Save button */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Button
              title="Save"
              onPress={handleSave}
              loading={updateProfile.isPending}
              disabled={!hasChanges()}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
