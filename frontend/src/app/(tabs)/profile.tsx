import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClerk } from '@clerk/clerk-expo';
import { useProfile, useSkinProfile } from '../../hooks/queries/useProfile';
import Card from '../../components/ui/Card';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { data: user } = useProfile();
  const { data: skinProfile } = useSkinProfile();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const initials = fullName
    ? fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const memberDays = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const menuItems = [
    { label: 'New skin scan', icon: '🔍', onPress: () => router.push('/(onboarding)/face-scan') },
    { label: 'Daily log', icon: '📝', onPress: () => router.push('/skin-log-modal') },
    { label: 'Preferences', icon: '⚙️', onPress: () => {} },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="items-center py-6">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3.5">
            <Text className="text-[28px] font-poppins-bold text-white">{initials}</Text>
          </View>
          <Text className="text-[22px] font-poppins-bold text-skin-text">{fullName || 'Radiance User'}</Text>
          <Text className="text-sm text-skin-text-secondary mt-1">Radiance member · {memberDays} days</Text>
        </View>

        {/* Skin Passport */}
        <Card dark style={{ marginBottom: 20 }}>
          <Text className="text-base font-poppins-bold text-white mb-3">Skin Passport</Text>
          <View className="flex-row flex-wrap gap-2">
            {skinProfile?.skinType && (
              <View className="px-3 py-1.5 rounded-full bg-white/[0.12]">
                <Text className="text-[13px] font-poppins-semibold text-white/80">{skinProfile.skinType}</Text>
              </View>
            )}
            {skinProfile?.sensitivityLevel && (
              <View className="px-3 py-1.5 rounded-full bg-white/[0.12]">
                <Text className="text-[13px] font-poppins-semibold text-white/80">{skinProfile.sensitivityLevel}</Text>
              </View>
            )}
            {skinProfile?.skinTone && (
              <View className="px-3 py-1.5 rounded-full bg-white/[0.12]">
                <Text className="text-[13px] font-poppins-semibold text-white/80">{skinProfile.skinTone} tone</Text>
              </View>
            )}
            {skinProfile?.concerns?.map((concern: string) => (
              <View key={concern} className="px-3 py-1.5 rounded-full bg-white/[0.12]">
                <Text className="text-[13px] font-poppins-semibold text-white/80">{concern}</Text>
              </View>
            ))}
          </View>
          {skinProfile?.skinScore && (
            <Text className="text-sm font-poppins-semibold text-primary mt-3.5">Score: {skinProfile.skinScore}</Text>
          )}
        </Card>

        {/* Menu */}
        <View className="bg-white rounded-xl overflow-hidden shadow-sm mb-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
          {menuItems.map((item) => (
            <Pressable key={item.label} className="flex-row items-center py-4 px-[18px] border-b border-skin-border-light gap-3" onPress={item.onPress}>
              <Text className="text-xl">{item.icon}</Text>
              <Text className="flex-1 text-base font-poppins-medium text-skin-text">{item.label}</Text>
              <Text className="text-[22px] text-skin-text-tertiary">›</Text>
            </Pressable>
          ))}
        </View>

        {/* Sign Out */}
        <Pressable className="items-center py-4" onPress={handleSignOut}>
          <Text className="text-base font-poppins-semibold text-error">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
