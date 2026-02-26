import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode, useState } from 'react';
import { COLORS } from '@/constants';

interface DoodleButtonProps {
  children: ReactNode;
  onPress?: () => void;
  bgColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

// Neubrutalism 스타일 버튼 컴포넌트
export default function DoodleButton({
  children,
  onPress,
  bgColor = COLORS.accent,
  textColor = COLORS.textPrimary,
  style,
}: DoodleButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.button,
        { backgroundColor: bgColor },
        pressed ? styles.shadowPressed : styles.shadow,
        pressed && styles.pressed,
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, { color: textColor }]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
  text: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
  },
});
