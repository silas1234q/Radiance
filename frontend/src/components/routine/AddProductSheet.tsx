import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useRouter, useNavigation } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { useProductSearch } from '../../hooks/queries/useProducts';
import type { Product } from '../../types/api';

export type AddProductSheetRef = BottomSheetModal;

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

async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
}

interface AddProductSheetProps {
  onSelect?: (product: { id: string; name: string; brand: string; imageUrl?: string; category?: string }) => void;
}

const AddProductSheet = forwardRef<BottomSheetModal, AddProductSheetProps>(({ onSelect }, ref) => {
  const router = useRouter();
  const navigation = useNavigation();
  const innerRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentProduct[]>([]);
  const navigatingToProduct = useRef(false);
  const { data: results, isLoading, isFetching } = useProductSearch(debouncedQuery);

  // Forward the inner ref so parent can call present/dismiss
  useImperativeHandle(ref, () => innerRef.current as BottomSheetModal);

  const snapPoints = useMemo(() => ['85%'], []);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches().then(setRecentSearches);
  }, []);

  // Re-present modal when screen regains focus after product detail navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (navigatingToProduct.current) {
        navigatingToProduct.current = false;
        // Small delay to let the screen transition finish
        setTimeout(() => innerRef.current?.present(), 100);
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleDismiss = useCallback(() => {
    // Only clear state if we're NOT navigating to a product
    if (!navigatingToProduct.current) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  const handleProductPress = useCallback(async (item: Product) => {
    const recent: RecentProduct = {
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: item.category,
      imageUrl: item.imageUrl,
    };
    const updated = await saveRecentSearch(recent);
    setRecentSearches(updated);

    if (onSelect) {
      onSelect({
        id: item.id,
        name: item.name,
        brand: item.brand,
        imageUrl: item.imageUrl,
        category: item.category,
      });
      innerRef.current?.dismiss();
      return;
    }

    // Mark that we're navigating so dismiss doesn't clear state
    navigatingToProduct.current = true;
    innerRef.current?.dismiss();
    router.push({ pathname: '/product-detail', params: { id: item.id } });
  }, [router, onSelect]);

  const handleClose = useCallback(() => {
    navigatingToProduct.current = false;
    innerRef.current?.dismiss();
  }, []);

  const handleClearRecent = useCallback(async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const showingRecent = query.trim().length < 2 && recentSearches.length > 0;

  const renderProduct = ({ item }: { item: Product | RecentProduct }) => {
    return (
      <Pressable onPress={() => handleProductPress(item)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#F2F2F7',
            gap: 14,
          }}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F2F2F7' }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#F2F2F7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="flask-outline" size={22} color={COLORS.textTertiary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 15, fontWeight: '500', color: COLORS.text }}
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
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </View>
      </Pressable>
    );
  };

  return (
    <BottomSheetModal
      ref={innerRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#E0E0E0', width: 40, height: 5 }}
      backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
    >
      {/* Title + Close */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>
          {onSelect ? 'Select Product' : 'Add Product'}
        </Text>
        <Pressable
          onPress={handleClose}
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

      {/* Search Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 20,
          marginBottom: 8,
          backgroundColor: '#F2F2F7',
          borderRadius: 14,
          paddingHorizontal: 14,
          height: 46,
          gap: 10,
        }}
      >
        <Ionicons name="search" size={18} color={COLORS.textTertiary} />
        <BottomSheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search skincare products..."
          placeholderTextColor={COLORS.textTertiary}
          style={{
            flex: 1,
            fontSize: 15,
            color: COLORS.text,
            padding: 0,
          }}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </Pressable>
        )}
        {isFetching && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      {/* Recent searches header */}
      {showingRecent && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary }}>
            Recent searches
          </Text>
          <Pressable onPress={handleClearRecent} hitSlop={8}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
              Clear all
            </Text>
          </Pressable>
        </View>
      )}

      {/* Results / Recent searches */}
      <BottomSheetFlatList
        data={showingRecent ? recentSearches : (results || [])}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            {debouncedQuery.length >= 2 && !isLoading ? (
              <>
                <Ionicons
                  name="search-outline"
                  size={40}
                  color={COLORS.textTertiary}
                />
                <Text
                  style={{
                    fontSize: 15,
                    color: COLORS.textSecondary,
                    marginTop: 12,
                  }}
                >
                  No products found
                </Text>
              </>
            ) : debouncedQuery.length < 2 && recentSearches.length === 0 ? (
              <>
                <Ionicons
                  name="flask-outline"
                  size={40}
                  color={COLORS.textTertiary}
                />
                <Text
                  style={{
                    fontSize: 15,
                    color: COLORS.textSecondary,
                    marginTop: 12,
                    textAlign: 'center',
                    maxWidth: 220,
                    lineHeight: 21,
                  }}
                >
                  Search for skincare products to add to your routine
                </Text>
              </>
            ) : null}
          </View>
        }
      />
    </BottomSheetModal>
  );
});

export default AddProductSheet;
