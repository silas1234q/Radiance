import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useProductSearch } from '../../hooks/queries/useProducts';
import { COLORS } from '../../constants/theme';
import type { Product } from '../../types/api';

const RECENT_SEARCHES_KEY = 'radiance:recent-product-searches';
const MAX_RECENT = 10;

interface RecentProduct {
  id: string;
  name: string;
  brand: string;
  category?: string;
  imageUrl?: string;
}

async function loadRecentSearches(): Promise<RecentProduct[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveRecentSearch(product: RecentProduct): Promise<RecentProduct[]> {
  const existing = await loadRecentSearches();
  const filtered = existing.filter((p) => p.id !== product.id);
  const updated = [product, ...filtered].slice(0, MAX_RECENT);
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

export default function ProductSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentProduct[]>([]);
  const { data: results, isLoading, isFetching } = useProductSearch(debouncedQuery);

  useEffect(() => {
    loadRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleProductPress = useCallback(async (item: Product | RecentProduct) => {
    const recent: RecentProduct = {
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: item.category ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
    };
    const updated = await saveRecentSearch(recent);
    setRecentSearches(updated);
    router.replace({ pathname: '/product-detail', params: { id: item.id } });
  }, [router]);

  const handleClearRecent = useCallback(async () => {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  }, []);

  const hasQuery = debouncedQuery.trim().length >= 2;
  const showRecent = !hasQuery && recentSearches.length > 0;

  const renderProduct = ({ item }: { item: Product | RecentProduct }) => (
    <Pressable onPress={() => handleProductPress(item)}>
      <View style={styles.card}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="flask-outline" size={20} color={COLORS.textTertiary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 15, fontFamily: 'SFProRounded_Medium', color: COLORS.text }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}
            numberOfLines={1}
          >
            {item.brand}
            {item.category ? ` \u00b7 ${item.category}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
      </View>
    </Pressable>
  );

  const listData = hasQuery ? (results || []) : showRecent ? recentSearches : [];

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        intensity={80}
        tint="systemChromeMaterialLight"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1, paddingTop: insets.top }}>
          {/* Search bar + Cancel */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.textTertiary} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search skincare products..."
                placeholderTextColor={COLORS.textTertiary}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {isFetching && <ActivityIndicator size="small" color={COLORS.primary} />}
              {query.length > 0 && !isFetching && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
                </Pressable>
              )}
            </View>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          {/* Recent searches header */}
          {showRecent && (
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent</Text>
              <Pressable onPress={handleClearRecent} hitSlop={8}>
                <Text style={styles.clearText}>Clear all</Text>
              </Pressable>
            </View>
          )}

          {/* Results / Recent */}
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {hasQuery && !isLoading ? (
                  <>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="search-outline" size={28} color={COLORS.textTertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try a different name or brand
                    </Text>
                  </>
                ) : !hasQuery && recentSearches.length === 0 ? (
                  <>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="flask-outline" size={28} color={COLORS.textTertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>Find your products</Text>
                    <Text style={styles.emptySubtitle}>
                      Search by name or brand to see how they fit your skin
                    </Text>
                  </>
                ) : null}
              </View>
            }
          />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'SFProRounded_Medium',
    color: COLORS.primary,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 100,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SFProRounded_Regular',
    color: '#1C1C1E',
    padding: 0,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontFamily: 'SFProRounded_Semibold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  clearText: {
    fontSize: 13,
    fontFamily: 'SFProRounded_Medium',
    color: COLORS.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#F2F2F7',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'SFProRounded_Semibold',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
