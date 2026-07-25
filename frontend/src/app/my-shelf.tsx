import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserProducts } from '../hooks/queries/useUserProducts';
import { COLORS } from '../constants/theme';
import CircleIconButton from '../components/ui/CircleIconButton';
import type { UserProduct } from '../types/api';

const TABS = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'scanned', label: 'Scanned' },
  { key: 'added', label: 'Added' },
] as const;

const EMPTY_MESSAGES: Record<string, string> = {
  recommended: 'Products recommended in your routines will appear here.',
  scanned: 'Scan a product barcode to add it to your shelf.',
  added: 'Products you manually add will show up here.',
};

export default function MyShelfScreen() {
  const router = useRouter();
  const { data: userProducts, isLoading } = useUserProducts();
  const [activeTab, setActiveTab] = useState<string>('recommended');

  const filtered = (userProducts ?? []).filter(up => up.source === activeTab);

  const handleProductPress = (productId: string) => {
    router.back();
    setTimeout(() => {
      router.push(`/product-detail?id=${productId}`);
    }, 300);
  };

  const renderItem = ({ item, index }: { item: UserProduct; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <Pressable
        onPress={() => handleProductPress(item.productId)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 14,
          marginBottom: 10,
          gap: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        {item.product.imageUrl ? (
          <Image
            source={{ uri: item.product.imageUrl }}
            style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F2F2F7' }}
          />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flask-outline" size={22} color={COLORS.textTertiary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }} numberOfLines={1}>
            {item.product.name}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {item.product.brand}
          </Text>
        </View>
        <View style={{ backgroundColor: `${COLORS.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>
            {item.product.category}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text }}>
            My Shelf
          </Text>
          <CircleIconButton icon="close" onPress={() => router.back()} />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: active ? COLORS.primary : '#fff',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: active ? 0 : 0.04,
                  shadowRadius: 4,
                  elevation: active ? 0 : 1,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : COLORS.text }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Product List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 }}>
              <Ionicons
                name={activeTab === 'recommended' ? 'sparkles-outline' : activeTab === 'scanned' ? 'scan-outline' : 'add-circle-outline'}
                size={48}
                color={COLORS.textTertiary}
              />
              <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 14, lineHeight: 22 }}>
                {isLoading ? 'Loading...' : EMPTY_MESSAGES[activeTab]}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
