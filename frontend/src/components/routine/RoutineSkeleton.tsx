import React from 'react';
import { View } from 'react-native';
import Skeleton from '../ui/Skeleton';

function StepCardSkeleton() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 18,
        marginBottom: 12,
        gap: 14,
      }}
    >
      <Skeleton width={44} height={44} borderRadius={12} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={100} height={12} borderRadius={6} />
        <Skeleton width={160} height={14} borderRadius={6} />
      </View>
      <Skeleton width={26} height={26} borderRadius={8} />
    </View>
  );
}

export function InsightSkeleton() {
  return (
    <View
      style={{
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(255, 240, 243, 0.5)',
        marginTop: 4,
        marginBottom: 8,
      }}
    >
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={110} height={14} borderRadius={6} />
        <Skeleton width={180} height={12} borderRadius={6} />
      </View>
    </View>
  );
}

export default function RoutineSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
      {/* Header skeleton */}
      <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 8 }}>
        <Skeleton width={140} height={22} borderRadius={8} />
      </View>

      {/* Week tracker skeleton */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} width={38} height={50} borderRadius={12} />
        ))}
      </View>

      {/* Insight card skeleton */}
      <InsightSkeleton />

      {/* Morning section */}
      <View style={{ marginTop: 16, marginBottom: 14 }}>
        <Skeleton width={140} height={16} borderRadius={6} />
      </View>
      <StepCardSkeleton />
      <StepCardSkeleton />
      <StepCardSkeleton />

      {/* Evening section */}
      <View style={{ marginTop: 20, marginBottom: 14 }}>
        <Skeleton width={140} height={16} borderRadius={6} />
      </View>
      <StepCardSkeleton />
      <StepCardSkeleton />
      <StepCardSkeleton />
    </View>
  );
}
