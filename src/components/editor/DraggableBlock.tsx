import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS } from '@/constants';
import type { BlockElement } from '@/stores/useProjectStore';

interface DraggableBlockProps {
  element: BlockElement;
  onPositionChange: (id: string, x: number, y: number) => void;
}

// 캔버스 위에서 자유롭게 드래그할 수 있는 블록
export default function DraggableBlock({
  element,
  onPositionChange,
}: DraggableBlockProps) {
  const translateX = useSharedValue(element.x);
  const translateY = useSharedValue(element.y);
  const scale = useSharedValue(1);

  // 드래그 시작 시점의 위치 저장
  const startX = useSharedValue(element.x);
  const startY = useSharedValue(element.y);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      scale.value = withSpring(1.05);
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      onPositionChange(element.id, translateX.value, translateY.value);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.block,
          {
            width: element.width,
            height: element.height,
            backgroundColor: element.color,
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.label}>{element.label ?? ''}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  label: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
