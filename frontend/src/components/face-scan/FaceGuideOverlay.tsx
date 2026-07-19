import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Defs, Mask, Path } from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FRAME_W = 260;
const FRAME_H = 340;
const FRAME_R = 130;
const CORNER_LEN = 40;
const CORNER_STROKE = 3.5;

// Leave bottom 130px clear for the shutter button area
const OVERLAY_H = SCREEN_H - 130;

const COLOR_GRAY = '#8E8E93';
const COLOR_YELLOW = '#FF9500';
const COLOR_GREEN = '#34C759';

interface FaceGuideOverlayProps {
  passedCount: number; // 0-6
}

export function FaceGuideOverlay({ passedCount }: FaceGuideOverlayProps) {
  const frameX = (SCREEN_W - FRAME_W) / 2;
  const frameY = (SCREEN_H - FRAME_H) / 2 - 30;

  const borderColor =
    passedCount >= 5 ? COLOR_GREEN : passedCount >= 3 ? COLOR_YELLOW : COLOR_GRAY;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="box-none">
      {/* Dark overlay with cutout — stops above the shutter area */}
      <Svg width={SCREEN_W} height={OVERLAY_H} pointerEvents="none">
        <Defs>
          <Mask id="cutout">
            <Rect width={SCREEN_W} height={OVERLAY_H} fill="white" />
            <Rect
              x={frameX}
              y={frameY}
              width={FRAME_W}
              height={FRAME_H}
              rx={FRAME_R}
              ry={FRAME_R}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          width={SCREEN_W}
          height={OVERLAY_H}
          fill="rgba(0,0,0,0.5)"
          mask="url(#cutout)"
        />
        {/* Border */}
        <Rect
          x={frameX}
          y={frameY}
          width={FRAME_W}
          height={FRAME_H}
          rx={FRAME_R}
          ry={FRAME_R}
          fill="none"
          stroke={borderColor}
          strokeWidth={2}
        />
      </Svg>

      {/* Corner brackets */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: frameX,
          top: frameY,
          width: FRAME_W,
          height: FRAME_H,
        }}
      >
        <CornerBrackets color={borderColor} />
      </View>
    </View>
  );
}

function CornerBrackets({ color }: { color: string }) {
  const w = FRAME_W;
  const h = FRAME_H;
  const c = CORNER_LEN;
  const r = 20;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Path
        d={`M ${c} 0 L ${r} 0 Q 0 0 0 ${r} L 0 ${c}`}
        stroke={color} strokeWidth={CORNER_STROKE} fill="none" strokeLinecap="round"
      />
      <Path
        d={`M ${w - c} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${c}`}
        stroke={color} strokeWidth={CORNER_STROKE} fill="none" strokeLinecap="round"
      />
      <Path
        d={`M 0 ${h - c} L 0 ${h - r} Q 0 ${h} ${r} ${h} L ${c} ${h}`}
        stroke={color} strokeWidth={CORNER_STROKE} fill="none" strokeLinecap="round"
      />
      <Path
        d={`M ${w} ${h - c} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${w - c} ${h}`}
        stroke={color} strokeWidth={CORNER_STROKE} fill="none" strokeLinecap="round"
      />
    </Svg>
  );
}

export { FRAME_W, FRAME_H, FRAME_R };
