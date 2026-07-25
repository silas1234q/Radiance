import React from 'react';
import { View, Text, ScrollView, Pressable, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSkinProfile, useProfile } from '../hooks/queries/useProfile';
import { COLORS } from '../constants/theme';
import CircleIconButton from '../components/ui/CircleIconButton';

export default function EditSkinProfileScreen() {
  const router = useRouter();
  const { data: skinProfile } = useSkinProfile();
  const { data: user } = useProfile();

  const concerns = skinProfile?.concerns ?? [];
  const topConcern = concerns[0] ?? '';
  const additionalConcerns = concerns.slice(1).join(', ') || 'None';
  const photoUrl = skinProfile?.photoUrl ?? user?.avatarUrl;

  const rows: { label: string; value: string; field?: string }[] = [
    { label: 'Main Skin Goal', value: topConcern || 'Select...', field: 'concerns' },
    { label: 'Additional\nSkin Concerns', value: additionalConcerns, field: 'concerns' },
    { label: 'Name', value: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Select...' },
    { label: 'Skin Type', value: skinProfile?.skinType || 'Select...', field: 'skinType' },
    { label: 'Skin Sensitivity', value: skinProfile?.sensitivityLevel || 'Select...', field: 'sensitivityLevel' },
    { label: 'Skin Tone', value: skinProfile?.skinTone || 'Select...', field: 'skinTone' },
    { label: 'Allergies', value: skinProfile?.allergies?.length ? skinProfile.allergies.join(', ') : 'None', field: 'allergies' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: 'whitesmoke' }}>
      <SafeAreaView className="flex-1 bg-transparent" edges={['top', 'bottom']}>
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
            My Skin Profile
          </Text>
        </View>

        {/* Subtitle */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ paddingHorizontal: 24, paddingBottom: 20 }}
        >
          <Text style={{ fontSize: 15, fontWeight: '400', color: COLORS.textSecondary, lineHeight: 22 }}>
            Update it to refresh your skincare recommendations and content.
          </Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* White card */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            {/* Face Scan row */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderBottomWidth: 0.5,
                borderBottomColor: '#E8E8E8',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                Face Scan
              </Text>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={{ width: 44, height: 44, borderRadius: 10 }}
                />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#F0F0F0',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="camera-outline" size={20} color={COLORS.textTertiary} />
                </View>
              )}
            </Pressable>

            {/* Data rows */}
            {rows.map((row, index) => (
              <Pressable
                key={row.label}
                onPress={() => {
                  if (row.field) {
                    router.push(`/edit-skin-field?field=${row.field}` as any);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                  borderBottomWidth: index < rows.length - 1 ? 0.5 : 0,
                  borderBottomColor: '#E8E8E8',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, maxWidth: '40%' }}>
                  {row.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '400',
                      color: row.value === 'Select...' ? COLORS.textTertiary : COLORS.textSecondary,
                      textAlign: 'right',
                    }}
                    numberOfLines={2}
                  >
                    {row.value}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                </View>
              </Pressable>
            ))}
          </Animated.View>
        </ScrollView>

        {/* Bottom button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 999,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E0E0E0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
