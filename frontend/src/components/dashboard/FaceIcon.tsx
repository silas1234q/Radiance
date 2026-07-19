import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

function renderFace(mood: string, cx: number, cy: number, strokeColor: string, sw: number, size: number) {
  const s = size / 52;
  const dotR = 1.5 * s;

  return (
    <>
      {mood === 'Bad' && (() => {
        // Sad droopy arc eyes + deep frown
        const eyeY = cy - 4 * s;
        const mouthY = cy + 10 * s;
        return (
          <>
            {/* Sad arc eyes - downward curves */}
            <Path d={`M${cx - 13 * s} ${eyeY - 3 * s} Q${cx - 9 * s} ${eyeY + 5 * s} ${cx - 5 * s} ${eyeY - 1 * s}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d={`M${cx + 5 * s} ${eyeY - 1 * s} Q${cx + 9 * s} ${eyeY + 5 * s} ${cx + 13 * s} ${eyeY - 3 * s}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            {/* Deep frown */}
            <Path d={`M${cx - 9 * s} ${mouthY + 2 * s} Q${cx} ${mouthY - 6 * s} ${cx + 9 * s} ${mouthY + 2 * s}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </>
        );
      })()}

      {mood === 'Not great' && (() => {
        // Flat/slightly sad arc eyes + slight frown
        const eyeY = cy - 4 * s;
        const mouthY = cy + 11 * s;
        return (
          <>
            {/* Flat sad arc eyes */}
            <Path d={`M${cx - 13 * s} ${eyeY - 1 * s} Q${cx - 9 * s} ${eyeY + 4 * s} ${cx - 5 * s} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d={`M${cx + 5 * s} ${eyeY} Q${cx + 9 * s} ${eyeY + 4 * s} ${cx + 13 * s} ${eyeY - 1 * s}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            {/* Slight frown */}
            <Path d={`M${cx - 9 * s} ${mouthY} Q${cx} ${mouthY - 5 * s} ${cx + 9 * s} ${mouthY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </>
        );
      })()}

      {mood === 'Okay' && (() => {
        // Gentle arc eyes + small smile
        const eyeY = cy - 3 * s;
        const mouthY = cy + 9 * s;
        return (
          <>
            {/* Soft arc eyes - shallow curve */}
            <Path d={`M${cx - 12 * s} ${eyeY} Q${cx - 9 * s} ${eyeY - 5 * s} ${cx - 6 * s} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d={`M${cx + 6 * s} ${eyeY} Q${cx + 9 * s} ${eyeY - 5 * s} ${cx + 12 * s} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            {/* Small gentle smile */}
            <Path d={`M${cx - 6 * s} ${mouthY} Q${cx} ${mouthY + 5 * s} ${cx + 6 * s} ${mouthY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </>
        );
      })()}

      {mood === 'Good' && (() => {
        // Wider squinted eyes + confident smile
        const eyeY = cy - 2 * s;
        const mouthY = cy + 8 * s;
        return (
          <>
            {/* Wider, deeper arc eyes */}
            <Path d={`M${cx - 14 * s} ${eyeY} Q${cx - 9 * s} ${eyeY - 10 * s} ${cx - 4 * s} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d={`M${cx + 4 * s} ${eyeY} Q${cx + 9 * s} ${eyeY - 10 * s} ${cx + 14 * s} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            {/* Wider smile */}
            <Path d={`M${cx - 10 * s} ${mouthY} Q${cx} ${mouthY + 9 * s} ${cx + 10 * s} ${mouthY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </>
        );
      })()}

      {mood === 'Awesome' && (() => {
        // Very squinted eyes + huge wide grin
        const eyeY = cy - 4 * s;
        const mouthY = cy + 6 * s;
        return (
          <>
            {/* Very tight squinted eyes - flatter, wider */}
            <Path d={`M${cx - 16 * s} ${eyeY} Q${cx - 10 * s} ${eyeY - 7 * s} ${cx - 4 * s} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d={`M${cx + 4 * s} ${eyeY} Q${cx + 10 * s} ${eyeY - 7 * s} ${cx + 16 * s} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
            {/* Huge open grin */}
            <Path d={`M${cx - 13 * s} ${mouthY} Q${cx} ${mouthY + 15 * s} ${cx + 13 * s} ${mouthY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </>
        );
      })()}
    </>
  );
}

export default function FaceIcon({ mood, size = 52, selected, noBackground, strokeWidth }: { mood: string; size?: number; selected?: boolean; noBackground?: boolean; strokeWidth?: number }) {
  const strokeColor = selected ? COLORS.primary : 'rgba(0,0,0,0.55)';
  const sw = strokeWidth ?? (size / 52) * 2.2;
  const r = size / 2;
  const cx = r;
  const cy = r;

  if (noBackground) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {renderFace(mood, cx, cy, strokeColor, sw, size)}
        </G>
      </Svg>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r - 1} fill="#FFFFFF" stroke="none" strokeWidth={0} />
      <G>
        {renderFace(mood, cx, cy, strokeColor, sw, size)}
      </G>
    </Svg>
    </View>
  );
}
