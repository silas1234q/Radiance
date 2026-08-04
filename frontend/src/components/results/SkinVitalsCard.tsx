import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

export type Vital = {
  /** Single-letter tag shown in the ring (H / O / R). */
  key: string;
  /** Full metric name, e.g. "Hydration Level". */
  label: string;
  /** 0–100 score. */
  value: number;
  /** Short qualitative description, e.g. "Well hydrated". */
  subtitle: string;
  /** Accent color for this vital. */
  color: string;
};

/**
 * Glassy "Skin Analysis" card: a stacked list of vitals (each with a small
 * percentage ring, name, and description) beside a concentric ring chart that
 * plots all three vitals at once. Styled to sit over the hero photo.
 */
export default function SkinVitalsCard({ vitals, score }: { vitals: Vital[]; score?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(120).duration(500).springify()} style={styles.wrap}>
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tintOverlay} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.overline}>Skin Analysis</Text>
          {score != null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Vitals list */}
          <View style={styles.list}>
            {vitals.map((v) => (
              <View key={v.key} style={styles.row}>
                <MiniRing value={v.value} color={v.color} />
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {v.label} <Text style={{ color: v.color }}>({v.key})</Text>
                  </Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {v.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Concentric ring chart */}
          <VitalsRing vitals={vitals} />
        </View>
      </View>
    </Animated.View>
  );
}

/** Small percentage ring with the value in the middle. */
function MiniRing({ value, color, size = 44 }: { value: number; color: string; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.miniValue}>{Math.round(value)}%</Text>
    </View>
  );
}

/** Concentric arcs — one ring per vital — with the tags stacked in the center. */
function VitalsRing({ vitals, size = 120 }: { vitals: Vital[]; size?: number }) {
  const stroke = 8;
  const gap = 5;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {vitals.map((v, i) => {
          const r = (size - stroke) / 2 - i * (stroke + gap);
          if (r <= 0) return null;
          const c = 2 * Math.PI * r;
          const dash = (Math.max(0, Math.min(100, v.value)) / 100) * c;
          return (
            <React.Fragment key={v.key}>
              <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} fill="none" />
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                stroke={v.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${dash} ${c - dash}`}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.ringCenter}>
        {vitals.map((v) => (
          <Text key={v.key} style={[styles.ringTag, { color: v.color }]}>
            {v.key}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  tintOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,20,26,0.5)' },
  content: { padding: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  overline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: 'SFProRounded_Semibold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 4,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'SFProRounded_Bold',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontFamily: 'SFProRounded_Medium',
  },
  body: { flexDirection: 'row', alignItems: 'center' },
  list: { flex: 1, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { flex: 1, marginLeft: 12 },
  rowLabel: { color: '#fff', fontSize: 13.5, fontFamily: 'SFProRounded_Semibold' },
  rowSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'SFProRounded_Regular', marginTop: 1 },
  miniValue: { position: 'absolute', color: '#fff', fontSize: 11, fontFamily: 'SFProRounded_Semibold' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringTag: { fontSize: 11, fontFamily: 'SFProRounded_Bold', lineHeight: 14, letterSpacing: 1 },
});
