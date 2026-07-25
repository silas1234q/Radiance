import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSkinProfile, useUpdateSkinProfile } from '../hooks/queries/useProfile';
import { COLORS } from '../constants/theme';
import GlassCard from '../components/ui/GlassCard';
import CircleIconButton from '../components/ui/CircleIconButton';

const ROUTINE_LENGTHS = [
  { value: 'minimal', label: 'Minimal', desc: '3-4 steps' },
  { value: 'standard', label: 'Standard', desc: '5-6 steps' },
  { value: 'extensive', label: 'Extensive', desc: '7+ steps' },
];

const BUDGETS = [
  { value: 'drugstore', label: 'Drugstore' },
  { value: 'midrange', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'none', label: 'No preference' },
];

const COMMON_AVOIDANCES = [
  'Fragrances',
  'Silicones',
  'Essential oils',
  'Sulfates',
  'Parabens',
  'Alcohol',
];

export default function RoutinePreferencesScreen() {
  const router = useRouter();
  const { data: profile } = useSkinProfile();
  const updateProfile = useUpdateSkinProfile();

  const [routineLength, setRoutineLength] = useState<string>('standard');
  const [productBudget, setProductBudget] = useState<string>('none');
  const [ingredientsToAvoid, setIngredientsToAvoid] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');

  useEffect(() => {
    if (profile) {
      setRoutineLength(profile.routineLength || 'standard');
      setProductBudget(profile.productBudget || 'none');
      setIngredientsToAvoid(profile.ingredientsToAvoid || []);
    }
  }, [profile]);

  const toggleAvoidance = (item: string) => {
    setIngredientsToAvoid(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const addCustomIngredient = () => {
    const trimmed = customIngredient.trim();
    if (trimmed && !ingredientsToAvoid.includes(trimmed)) {
      setIngredientsToAvoid(prev => [...prev, trimmed]);
      setCustomIngredient('');
    }
  };

  const handleSave = () => {
    updateProfile.mutate(
      { routineLength, productBudget, ingredientsToAvoid },
      {
        onSuccess: () => {
          Alert.alert('Saved', 'Your routine preferences have been updated.');
          router.back();
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 14 }}>
          <CircleIconButton icon="chevron-back" onPress={() => router.back()} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text }}>
            Routine Preferences
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Routine Length */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 }}>
              ROUTINE LENGTH
            </Text>
            <GlassCard style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {ROUTINE_LENGTHS.map(opt => {
                  const active = routineLength === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setRoutineLength(opt.value)}
                      style={{
                        flex: 1,
                        minWidth: 90,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        backgroundColor: active ? COLORS.primary : '#F2F2F7',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: active ? '#fff' : COLORS.text }}>
                        {opt.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.8)' : COLORS.textTertiary, marginTop: 2 }}>
                        {opt.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Product Budget */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 }}>
              PRODUCT BUDGET
            </Text>
            <GlassCard style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {BUDGETS.map(opt => {
                  const active = productBudget === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setProductBudget(opt.value)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 20,
                        backgroundColor: active ? COLORS.primary : '#F2F2F7',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#fff' : COLORS.text }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Ingredients to Avoid */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 }}>
              INGREDIENTS TO AVOID
            </Text>
            <GlassCard style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {COMMON_AVOIDANCES.map(item => {
                  const active = ingredientsToAvoid.includes(item);
                  return (
                    <Pressable
                      key={item}
                      onPress={() => toggleAvoidance(item)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        backgroundColor: active ? COLORS.primary : '#F2F2F7',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '500', color: active ? '#fff' : COLORS.text }}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
                {/* Custom ones not in the predefined list */}
                {ingredientsToAvoid
                  .filter(i => !COMMON_AVOIDANCES.includes(i))
                  .map(item => (
                    <Pressable
                      key={item}
                      onPress={() => toggleAvoidance(item)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        backgroundColor: COLORS.primary,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#fff' }}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <TextInput
                  value={customIngredient}
                  onChangeText={setCustomIngredient}
                  placeholder="Add custom ingredient..."
                  placeholderTextColor={COLORS.textTertiary}
                  onSubmitEditing={addCustomIngredient}
                  style={{
                    flex: 1,
                    backgroundColor: '#F2F2F7',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: COLORS.text,
                  }}
                />
                <Pressable
                  onPress={addCustomIngredient}
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Add</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Save Button */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Pressable
              onPress={handleSave}
              disabled={updateProfile.isPending}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: updateProfile.isPending ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {updateProfile.isPending ? 'Saving...' : 'Save Preferences'}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
