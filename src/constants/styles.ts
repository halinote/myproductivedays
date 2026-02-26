// Neubrutalism 공통 스타일 상수
import { COLORS } from './colors';

// 삐뚤빼뚤한 손그림 border radius
export const DOODLE_BORDER_RADIUS = {
  borderTopLeftRadius: 15,
  borderTopRightRadius: 5,
  borderBottomRightRadius: 12,
  borderBottomLeftRadius: 8,
};

// 기본 Neubrutalism 스타일
export const DOODLE_BASE = {
  borderWidth: 3,
  borderColor: COLORS.border,
  ...DOODLE_BORDER_RADIUS,
};

// 하드 섀도우
export const DOODLE_SHADOW = {
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
};

// 눌림 효과 (pressed state)
export const DOODLE_PRESSED = {
  shadowOffset: { width: 2, height: 2 },
  transform: [{ translateY: 1 }],
};
