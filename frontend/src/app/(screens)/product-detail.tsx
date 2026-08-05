import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useProductAnalysis } from '../../hooks/queries/useProducts';
import { COLORS } from '../../constants/theme';
import CircleIconButton from '../../components/ui/CircleIconButton';
import Skeleton from '../../components/ui/Skeleton';

function FitScoreRing({ score }: { score: number }) {
  const color =
    score >= 75 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error;

  return (
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{score}%</Text>
    </View>
  );
}

function IngredientFlag({ name, safe }: { name: string; safe: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
        paddingVertical: 8,
        gap: 8,
      }}
    >
      <Ionicons
        name={safe ? 'checkmark-circle' : 'close-circle'}
        size={22}
        color={safe ? COLORS.success : COLORS.error}
      />
      <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '400' }}>
        {name}
      </Text>
    </View>
  );
}

// --- Key Ingredients ---

interface KeyIngredientInfo {
  label: string;
  benefit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  strength: number; // 0-1 visual bar fill
}

const KEY_INGREDIENT_DB: Record<string, Omit<KeyIngredientInfo, 'label'> & { label?: string }> = {
  'hyaluronic acid':   { benefit: 'Deep hydration & plumping',       icon: 'water-outline',       color: '#5AC8FA', strength: 0.9 },
  'niacinamide':       { benefit: 'Reduces pores & oil control',     icon: 'shield-checkmark-outline', color: '#AF52DE', strength: 0.85 },
  'salicylic acid':    { benefit: 'Unclogs pores & fights acne',     icon: 'flame-outline',       color: '#FF6B6B', strength: 0.8 },
  'glycolic acid':     { benefit: 'Exfoliates & brightens',          icon: 'sparkles-outline',    color: '#FFD60A', strength: 0.75 },
  'lactic acid':       { benefit: 'Gentle exfoliation & hydration',  icon: 'sparkles-outline',    color: '#FFD60A', strength: 0.65 },
  'vitamin c':         { benefit: 'Brightens & protects from damage',icon: 'sunny-outline',       color: '#FF9F0A', strength: 0.9 },
  'ascorbic acid':     { label: 'Vitamin C', benefit: 'Potent antioxidant & brightener', icon: 'sunny-outline', color: '#FF9F0A', strength: 0.9 },
  'retinol':           { benefit: 'Boosts cell turnover & collagen', icon: 'trending-up-outline', color: '#FF375F', strength: 0.95 },
  'retinal':           { label: 'Retinal', benefit: 'Advanced form of vitamin A', icon: 'trending-up-outline', color: '#FF375F', strength: 0.9 },
  'ceramide':          { benefit: 'Restores skin barrier',           icon: 'shield-outline',      color: '#30D158', strength: 0.8 },
  'squalane':          { benefit: 'Lightweight moisture & repair',   icon: 'leaf-outline',        color: '#34C759', strength: 0.7 },
  'peptide':           { benefit: 'Supports collagen & firmness',    icon: 'fitness-outline',     color: '#5E5CE6', strength: 0.8 },
  'centella asiatica':  { label: 'Centella', benefit: 'Calms irritation & redness',  icon: 'leaf-outline',   color: '#30D158', strength: 0.75 },
  'centella':          { benefit: 'Calms irritation & redness',      icon: 'leaf-outline',        color: '#30D158', strength: 0.75 },
  'tea tree':          { benefit: 'Natural antibacterial',           icon: 'leaf-outline',        color: '#34C759', strength: 0.65 },
  'zinc oxide':        { benefit: 'Gentle mineral sun protection',   icon: 'umbrella-outline',    color: '#64D2FF', strength: 0.85 },
  'titanium dioxide':  { benefit: 'Mineral UV filter',               icon: 'umbrella-outline',    color: '#64D2FF', strength: 0.8 },
  'azelaic acid':      { benefit: 'Reduces acne & evens tone',      icon: 'color-palette-outline', color: '#BF5AF2', strength: 0.8 },
  'panthenol':         { label: 'Panthenol (B5)', benefit: 'Soothes & hydrates',       icon: 'heart-outline',       color: '#FF6B6B', strength: 0.7 },
  'allantoin':         { benefit: 'Calms & softens skin',            icon: 'heart-outline',       color: '#FF6B6B', strength: 0.6 },
  'aloe vera':         { benefit: 'Soothes & calms skin',            icon: 'leaf-outline',        color: '#30D158', strength: 0.6 },
  'glycerin':          { benefit: 'Attracts & retains moisture',     icon: 'water-outline',       color: '#5AC8FA', strength: 0.7 },
  'shea butter':       { benefit: 'Rich emollient for deep moisture',icon: 'water-outline',       color: '#5AC8FA', strength: 0.7 },
  'bakuchiol':         { benefit: 'Plant-based retinol alternative', icon: 'leaf-outline',        color: '#30D158', strength: 0.75 },
  'tranexamic acid':   { benefit: 'Fades dark spots & pigmentation',icon: 'color-palette-outline', color: '#BF5AF2', strength: 0.8 },
  'kojic acid':        { benefit: 'Brightens & evens skin tone',     icon: 'sparkles-outline',    color: '#FFD60A', strength: 0.7 },
  'arbutin':           { benefit: 'Lightens hyperpigmentation',      icon: 'sparkles-outline',    color: '#FFD60A', strength: 0.7 },
  'caffeine':          { benefit: 'Reduces puffiness & dark circles',icon: 'cafe-outline',        color: '#A2845E', strength: 0.65 },
  'collagen':          { benefit: 'Supports skin elasticity',        icon: 'fitness-outline',     color: '#5E5CE6', strength: 0.65 },
};

function extractKeyIngredients(ingredients: string[]): KeyIngredientInfo[] {
  const found: KeyIngredientInfo[] = [];
  const seen = new Set<string>();

  for (const raw of ingredients) {
    const lower = raw.toLowerCase().trim();
    for (const [key, info] of Object.entries(KEY_INGREDIENT_DB)) {
      if (seen.has(key)) continue;
      if (lower.includes(key)) {
        seen.add(key);
        // Also mark related keys to avoid duplicates (e.g. centella / centella asiatica)
        if (key === 'centella asiatica') seen.add('centella');
        if (key === 'centella') seen.add('centella asiatica');
        if (key === 'ascorbic acid') seen.add('vitamin c');
        if (key === 'vitamin c') seen.add('ascorbic acid');
        found.push({
          label: info.label || key.charAt(0).toUpperCase() + key.slice(1),
          benefit: info.benefit,
          icon: info.icon,
          color: info.color,
          strength: info.strength,
        });
      }
    }
  }

  // Sort by strength descending — hero ingredients first
  return found.sort((a, b) => b.strength - a.strength);
}

function KeyIngredientRow({ item }: { item: KeyIngredientInfo }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: `${item.color}15`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>
          {item.label}
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
          {item.benefit}
        </Text>
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: `${item.color}20`,
            marginTop: 8,
          }}
        >
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: item.color,
              width: `${Math.round(item.strength * 100)}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
}

function getIngredientMeta(name: string): { icon: keyof typeof Ionicons.glyphMap; color: string; desc: string | null } {
  const lower = name.toLowerCase().trim();
  for (const [key, info] of Object.entries(KEY_INGREDIENT_DB)) {
    if (lower.includes(key)) return { icon: info.icon, color: info.color, desc: info.benefit };
  }
  if (lower.includes('acid')) return { icon: 'flask-outline', color: '#AF52DE', desc: 'Active compound' };
  if (lower.includes('oil') || lower.includes('butter')) return { icon: 'water-outline', color: '#5AC8FA', desc: 'Emollient & moisture' };
  if (lower.includes('extract') || lower.includes('leaf') || lower.includes('root') || lower.includes('seed'))
    return { icon: 'leaf-outline', color: '#30D158', desc: 'Plant-derived ingredient' };
  if (lower.includes('vitamin')) return { icon: 'sunny-outline', color: '#FF9F0A', desc: 'Essential nutrient for skin' };
  if (lower.includes('fragrance') || lower.includes('parfum')) return { icon: 'alert-circle-outline', color: '#FF9500', desc: 'Added scent — may irritate sensitive skin' };
  if (lower.includes('alcohol') && !lower.includes('cetyl') && !lower.includes('cetearyl') && !lower.includes('stearyl'))
    return { icon: 'alert-circle-outline', color: '#FF9500', desc: 'Solvent — can be drying' };
  if (lower.includes('glycer')) return { icon: 'water-outline', color: '#5AC8FA', desc: 'Humectant — draws in moisture' };
  if (lower.includes('sodium') || lower.includes('potassium')) return { icon: 'beaker-outline', color: '#8E8E93', desc: 'Functional ingredient' };
  if (lower.includes('phenoxy') || lower.includes('paraben') || lower.includes('sorbate'))
    return { icon: 'shield-outline', color: '#8E8E93', desc: 'Preservative — keeps product safe' };
  if (lower.includes('dimethicone') || lower.includes('siloxane') || lower.includes('silicone'))
    return { icon: 'layers-outline', color: '#8E8E93', desc: 'Smoothing silicone' };
  return { icon: 'ellipse-outline', color: COLORS.textTertiary, desc: null };
}

const COLLAPSED_COUNT = 5;

function IngredientsList({ ingredients }: { ingredients: string[] }) {
  const [expanded, setExpanded] = useState(false);

  // Sort: recognized ingredients (with desc) first, rest keep original order
  const sorted = [...ingredients].sort((a, b) => {
    const aHas = getIngredientMeta(a).desc ? 0 : 1;
    const bHas = getIngredientMeta(b).desc ? 0 : 1;
    return aHas - bHas;
  });

  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const hasMore = sorted.length > COLLAPSED_COUNT;
  const total = sorted.length;

  return (
    <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
        Ingredients
      </Text>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16 }}>
        {visible.map((ing, i) => {
          const meta = getIngredientMeta(ing);
          const isKey = Object.keys(KEY_INGREDIENT_DB).some((k) =>
            ing.toLowerCase().includes(k),
          );
          // Higher position = higher concentration → longer bar
          const concentration = Math.max(0.15, 1 - i / total);
          const barColor = isKey ? meta.color : '#D1D1D6';
          const trackColor = isKey ? `${meta.color}15` : '#F2F2F7';

          return (
            <View key={i}>
              <View style={{ paddingVertical: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: `${meta.color}12`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={meta.icon} size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isKey ? '600' : '400',
                        color: isKey ? COLORS.text : COLORS.textSecondary,
                      }}
                      numberOfLines={1}
                    >
                      {ing.trim()}
                    </Text>
                    {meta.desc && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: COLORS.textTertiary,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {meta.desc}
                      </Text>
                    )}
                  </View>
                  {isKey && (
                    <View
                      style={{
                        backgroundColor: `${meta.color}15`,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: meta.color }}>
                        KEY
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: trackColor,
                    marginLeft: 46,
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: barColor,
                      width: `${Math.round(concentration * 100)}%`,
                    }}
                  />
                </View>
              </View>
              {i < visible.length - 1 && (
                <View style={{ height: 1, backgroundColor: '#F2F2F7' }} />
              )}
            </View>
          );
        })}

        {hasMore && (
          <Pressable
            onPress={() => setExpanded(!expanded)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              gap: 6,
              borderTopWidth: 1,
              borderTopColor: '#F2F2F7',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
              {expanded ? 'Show less' : `Show all ${ingredients.length} ingredients`}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.primary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useProductAnalysis(id!);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Animated.View exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Skeleton width={36} height={36} borderRadius={18} />
              <Skeleton width={36} height={36} borderRadius={18} />
            </View>

            {/* Product image */}
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Skeleton width={200} height={240} borderRadius={20} />
            </View>

            {/* Brand + Category */}
            <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 20 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Skeleton width={80} height={14} borderRadius={7} />
                <Skeleton width={70} height={14} borderRadius={7} />
              </View>
              <Skeleton width={240} height={24} borderRadius={8} />
            </View>

            {/* Fit score card */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 24,
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 20,
                alignItems: 'center',
                gap: 14,
              }}
            >
              <Skeleton width={120} height={12} borderRadius={6} />
              <Skeleton width={72} height={72} borderRadius={36} />
              <Skeleton width={200} height={14} borderRadius={7} />
            </View>

            {/* Pros/Cons */}
            <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 12 }}>
              <View style={{ backgroundColor: '#F0FFF4', borderRadius: 16, padding: 16, gap: 10 }}>
                <Skeleton width={100} height={16} borderRadius={8} />
                <Skeleton width="90%" height={12} borderRadius={6} />
                <Skeleton width="75%" height={12} borderRadius={6} />
              </View>
              <View style={{ backgroundColor: '#FFF5F5', borderRadius: 16, padding: 16, gap: 10 }}>
                <Skeleton width={90} height={16} borderRadius={8} />
                <Skeleton width="80%" height={12} borderRadius={6} />
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  const product = data?.product;
  const analysis = data?.analysis;

  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>Product not found</Text>
      </View>
    );
  }

  const handleShare = async () => {
    const title = product.brand ? `${product.name} (${product.brand})` : product.name;
    const message = [title, product.sourceUrl, 'Shared via Radiance']
      .filter(Boolean)
      .join('\n\n');
    try {
      await Share.share({ message });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7"}}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <CircleIconButton icon="chevron-back" onPress={() => router.back()} />
          <CircleIconButton icon="share-outline" onPress={handleShare} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image */}
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={{ width: 200, height: 240, borderRadius: 20 }}
                resizeMode="contain"
              />
            ) : (
              <View
                style={{
                  width: 200,
                  height: 240,
                  borderRadius: 20,
                  backgroundColor: COLORS.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="flask-outline" size={64} color={COLORS.textTertiary} />
              </View>
            )}
          </View>

          {/* Brand + Category */}
          <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' }}>
                {product.brand}
              </Text>
              <View style={{ width: 1, height: 14, backgroundColor: COLORS.border }} />
              <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '500' }}>
                {product.category}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                textTransform: 'capitalize',
                color: COLORS.text,
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 30,
              }}
            >
              {product.name}
            </Text>
          </View>

          {/* Fit Score */}
          {analysis && (
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 24,
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 14 }}>
                FIT FOR YOUR SKIN
              </Text>
              <FitScoreRing score={analysis.fitScore} />
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center' }}>
                {analysis.fitScore >= 75
                  ? 'Great match for your skin profile'
                  : analysis.fitScore >= 50
                    ? 'Decent match — check the details below'
                    : 'May not be ideal for your skin'}
              </Text>
            </View>
          )}

          {/* Why it helps / Why it might not */}
          {analysis && (analysis.pros.length > 0 || analysis.cons.length > 0) && (
            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
              {analysis.pros.length > 0 && (
                <View
                  style={{
                    backgroundColor: '#F0FFF4',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10 }}>
                    Why it helps
                  </Text>
                  {analysis.pros.map((pro: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 14, color: COLORS.text, flex: 1, lineHeight: 20 }}>{pro}</Text>
                    </View>
                  ))}
                </View>
              )}

              {analysis.cons.length > 0 && (
                <View
                  style={{
                    backgroundColor: '#FFF5F5',
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10 }}>
                    Watch out
                  </Text>
                  {analysis.cons.map((con: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                      <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 14, color: COLORS.text, flex: 1, lineHeight: 20 }}>{con}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Where to buy */}
          {product.sourceUrl && (
            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
              <Pressable
                onPress={() => Linking.openURL(product.sourceUrl!)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                    Where to buy
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
                    View product page
                  </Text>
                </View>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: COLORS.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...Platform.select({
                      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
                      android: { elevation: 2 },
                    }),
                  }}
                >
                  <Ionicons name="open-outline" size={20} color={COLORS.text} />
                </View>
              </Pressable>
            </View>
          )}

          {/* Ingredients list */}
          {product.ingredients && product.ingredients.length > 0 && (
            <IngredientsList ingredients={product.ingredients} />
          )}

          {/* What's inside */}
          {analysis && analysis.ingredientFlags.length > 0 && (
            <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>
                What's inside
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {analysis.ingredientFlags.map((flag, i) => (
                  <IngredientFlag key={i} name={flag.name} safe={flag.safe} />
                ))}
              </View>
            </View>
          )}

          {/* Key Ingredients */}
          {(() => {
            const keyIngredients = product.ingredients?.length
              ? extractKeyIngredients(product.ingredients)
              : [];
            if (keyIngredients.length === 0) return null;
            return (
              <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>
                  Key Ingredients
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    marginTop: 8,
                  }}
                >
                  {keyIngredients.map((item, i) => (
                    <View key={item.label}>
                      <KeyIngredientRow item={item} />
                      {i < keyIngredients.length - 1 && (
                        <View style={{ height: 1, backgroundColor: '#F2F2F7' }} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* Product description */}
          {product.description && (
            <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
                About
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 }}>
                {product.description}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
