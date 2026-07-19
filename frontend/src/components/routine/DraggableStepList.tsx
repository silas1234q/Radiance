import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const ITEM_HEIGHT = 82;

interface DraggableStepListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (data: T[]) => void;
}

interface DraggableItemProps<T> {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  activeIndex: SharedValue<number>;
  translateY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  itemCount: number;
  onDragStart: (index: number) => void;
  onDragUpdate: (translationY: number) => void;
  onDragEnd: () => void;
}

function DraggableItem<T>({
  item,
  index,
  renderItem,
  activeIndex,
  translateY,
  isDragging,
  itemCount,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}: DraggableItemProps<T>) {
  const animatedStyle = useAnimatedStyle(() => {
    if (!isDragging.value) {
      return {
        transform: [{ translateY: withTiming(0, { duration: 150 }) }, { scale: withTiming(1, { duration: 150 }) }],
        zIndex: 0,
        opacity: 1,
      };
    }

    if (activeIndex.value === index) {
      return {
        transform: [{ translateY: translateY.value }, { scale: 1.03 }],
        zIndex: 100,
        opacity: 0.95,
      };
    }

    const currentPos = activeIndex.value;
    const targetPos = Math.round(translateY.value / ITEM_HEIGHT) + currentPos;
    const clampedTarget = Math.max(0, Math.min(itemCount - 1, targetPos));

    let shift = 0;
    if (index > currentPos && index <= clampedTarget) {
      shift = -ITEM_HEIGHT;
    } else if (index < currentPos && index >= clampedTarget) {
      shift = ITEM_HEIGHT;
    }

    return {
      transform: [{ translateY: withTiming(shift, { duration: 200 }) }, { scale: 1 }],
      zIndex: 0,
      opacity: 1,
    };
  });

  const longPressAndPan = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart(() => {
      runOnJS(onDragStart)(index);
    })
    .onUpdate((e) => {
      runOnJS(onDragUpdate)(e.translationY);
    })
    .onEnd(() => {
      runOnJS(onDragEnd)();
    });

  return (
    <GestureDetector gesture={longPressAndPan}>
      <Animated.View style={animatedStyle}>
        {renderItem(item, index)}
      </Animated.View>
    </GestureDetector>
  );
}

export default function DraggableStepList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
}: DraggableStepListProps<T>) {
  const activeIndex = useSharedValue(-1);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const hasEnded = useRef(false);

  const handleDragStart = useCallback((index: number) => {
    hasEnded.current = false;
    activeIndex.value = index;
    isDragging.value = true;
    translateY.value = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragUpdate = useCallback((translationYValue: number) => {
    translateY.value = translationYValue;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (hasEnded.current) return;
    hasEnded.current = true;

    const fromIndex = activeIndex.value;
    if (fromIndex < 0) {
      isDragging.value = false;
      activeIndex.value = -1;
      return;
    }

    const offset = Math.round(translateY.value / ITEM_HEIGHT);
    const toIndex = Math.max(0, Math.min(dataRef.current.length - 1, fromIndex + offset));

    if (fromIndex !== toIndex) {
      const newData = [...dataRef.current];
      const [moved] = newData.splice(fromIndex, 1);
      newData.splice(toIndex, 0, moved);
      onReorder(newData);
    }

    translateY.value = withTiming(0, { duration: 150 });
    isDragging.value = false;
    activeIndex.value = -1;
  }, [onReorder]);

  return (
    <View>
      {data.map((item, index) => (
        <DraggableItem
          key={keyExtractor(item, index)}
          item={item}
          index={index}
          renderItem={renderItem}
          activeIndex={activeIndex}
          translateY={translateY}
          isDragging={isDragging}
          itemCount={data.length}
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        />
      ))}
    </View>
  );
}
