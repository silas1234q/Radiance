import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  dark?: boolean;
}

export default function Card({ children, style, dark }: CardProps) {
  return (
    <View
      className={`bg-white rounded-xl p-4 shadow-sm shadow-black/[0.06] elevation-3 ${dark ? 'bg-skin-dark' : ''}`}
      style={style}
    >
      {children}
    </View>
  );
}
