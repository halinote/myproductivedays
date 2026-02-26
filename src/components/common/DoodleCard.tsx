import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode, useState } from 'react';
import { COLORS } from '@/constants';

interface DoodleCardProps {
  children: ReactNode;
  bgColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  shadow?: boolean;
}

// Neubrutalism 스타일 카드 컴포넌트
export default function DoodleCard({
  children,
  bgColor = 'white',
  onPress,
  style,
  shadow = true,
}: DoodleCardProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.card,
        { backgroundColor: bgColor },
        shadow && (pressed ? styles.shadowPressed : styles.shadow),
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3,
    borderColor: COLORS.border,
    // 삐뚤빼뚤한 손그림 느낌 radius
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  shadow: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  shadowPressed: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
});
