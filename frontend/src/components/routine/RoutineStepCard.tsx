import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface RoutineStepCardProps {
  name: string;
  description?: string;
  productName?: string;
  isCompleted: boolean;
  onToggle: () => void;
  locked?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  productImageUrl?: string;
  onImagePress?: () => void;
}

export default function RoutineStepCard({
  name,
  description,
  productName,
  isCompleted,
  onToggle,
  locked,
  icon,
  iconColor,
  productImageUrl,
  onImagePress,
}: RoutineStepCardProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 18,
        gap: 14,
      }}
    >
      {/* Product Image / Placeholder */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onImagePress?.();
        }}
        style={{ position: 'relative' }}
      >
        {productImageUrl ? (
          <Image
            source={{ uri: productImageUrl }}
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F2F2F7' }}
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: COLORS.borderLight,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <Ionicons name="image-outline" size={20} color={COLORS.textTertiary} />
          </View>
        )}
        {/* Completion badge */}
        {isCompleted && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#5B7BF8',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#fff',
            }}
          >
            <Ionicons name="checkmark" size={11} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            color: isCompleted ? COLORS.textTertiary : COLORS.text,
            fontWeight: '500',
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        {description && (
          <Text
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
              marginTop: 2,
              lineHeight: 18,
            }}
            numberOfLines={1}
          >
            {description.replace(/^\[(AM|PM)\]\s*/, '').split('.')[0]}
          </Text>
        )}
        {productName && (
          <Text
            style={{
              fontSize: 12,
              marginTop: 4,
              color: isCompleted ? COLORS.textTertiary : COLORS.primary,
              fontWeight: '500',
            }}
            numberOfLines={1}
          >
            {productName}
          </Text>
        )}
      </View>

      {/* Right icon */}
      {icon && (
        <Ionicons name={icon} size={18} color={iconColor || COLORS.primary} />
      )}
      {locked && !icon && (
        <Ionicons name="lock-closed" size={16} color={COLORS.borderLight} />
      )}
    </Pressable>
  );
}
