import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS } from '@/constants';
import {
  useProjectStore,
  MixElement,
  MixElementType,
} from '@/stores/useProjectStore';

// 캔버스 사이즈 (EditorScreen과 동일 비율 사용)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 48;
const CANVAS_HEIGHT = CANVAS_WIDTH * (852 / 393);

// --- 바텀 탭 정의 ---
const BOTTOM_TABS = ['스티커', '텍스트', '도형', '테이프'] as const;
type BottomTab = (typeof BOTTOM_TABS)[number];

// 스티커 이모지 목록
const STICKER_EMOJIS = [
  '✨', '💖', '🍀', '⭐', '☕', '🎧', '🏃', '📚',
  '💤', '🍕', '🌸', '☀️', '🌈', '🔥', '🎵',
];

// 도형 목록
const SHAPES = [
  { label: '원', shape: 'circle' as const, emoji: '⭕' },
  { label: '사각', shape: 'rect' as const, emoji: '⬜' },
  { label: '하트', shape: 'heart' as const, emoji: '🩷' },
  { label: '별', shape: 'star' as const, emoji: '⭐' },
];

// 도형 색상
const SHAPE_COLORS = ['#FFDE59', '#91D0FF', '#FF91AD', '#F0FFF4', '#F3E5F5', '#FFF8E1'];

// 테이프 색상 목록
const TAPE_COLORS = [
  '#FFDE59', '#91D0FF', '#FF91AD', '#A5D6A7',
  '#CE93D8', '#FFB74D', '#80CBC4', '#F48FB1',
];

// 캔버스 중앙 근처 랜덤 위치 생성
function randomCanvasPosition(width: number, height: number) {
  const cx = CANVAS_WIDTH / 2 - width / 2;
  const cy = CANVAS_HEIGHT / 2 - height / 2;
  return {
    x: cx + (Math.random() - 0.5) * 80,
    y: cy + (Math.random() - 0.5) * 80,
  };
}

// 고유 ID 생성
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// =====================================================
// 드래그 가능한 믹스 요소 컴포넌트
// =====================================================
interface DraggableMixElementProps {
  element: MixElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onScaleChange: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onTextChange?: (id: string, text: string) => void;
}

function DraggableMixElement({
  element,
  isSelected,
  onSelect,
  onPositionChange,
  onScaleChange,
  onDelete,
  onTextChange,
}: DraggableMixElementProps) {
  const translateX = useSharedValue(element.x);
  const translateY = useSharedValue(element.y);
  const scale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const startX = useSharedValue(element.x);
  const startY = useSharedValue(element.y);

  // 텍스트 편집 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(element.content);

  // 요소 선택 핸들러 (JS 스레드에서 실행)
  const handleSelect = useCallback(() => {
    onSelect(element.id);
  }, [onSelect, element.id]);

  // 위치 변경 핸들러 (JS 스레드에서 실행)
  const handlePositionChange = useCallback(
    (x: number, y: number) => {
      onPositionChange(element.id, x, y);
    },
    [onPositionChange, element.id]
  );

  // 팬 제스처 — 드래그로 위치 이동
  const panGesture = Gesture.Pan()
    .enabled(!element.locked)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      scale.value = withSpring(1.08);
      runOnJS(handleSelect)();
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(handlePositionChange)(translateX.value, translateY.value);
    });

  // 크기 변경 핸들러
  const handleScaleChange = useCallback(
    (s: number) => {
      const newW = Math.max(20, Math.round(element.width * s));
      const newH = Math.max(20, Math.round(element.height * s));
      onScaleChange(element.id, newW, newH);
    },
    [onScaleChange, element.id, element.width, element.height]
  );

  // 핀치 제스처 — 크기 조절
  const pinchGesture = Gesture.Pinch()
    .enabled(!element.locked)
    .onUpdate((event) => {
      pinchScale.value = event.scale;
    })
    .onEnd(() => {
      runOnJS(handleScaleChange)(pinchScale.value);
      pinchScale.value = 1;
    });

  // 탭 제스처 — 요소 선택
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleSelect)();
  });

  // 팬 + 탭 + 핀치 동시 처리
  const composedGesture = Gesture.Simultaneous(tapGesture, panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value * pinchScale.value },
      { rotate: `${element.rotation}deg` },
    ],
    opacity: element.opacity,
  }));

  // 텍스트 편집 완료
  const handleTextSubmit = () => {
    setIsEditing(false);
    if (onTextChange) {
      onTextChange(element.id, editText);
    }
  };

  // 요소 타입별 렌더링
  const renderContent = () => {
    switch (element.type) {
      case 'sticker':
        return <Text style={styles.stickerContent}>{element.content}</Text>;

      case 'text':
        if (isEditing && isSelected) {
          return (
            <TextInput
              style={[
                styles.textInput,
                {
                  fontSize: element.fontSize ?? 18,
                  color: element.color ?? COLORS.textPrimary,
                  fontFamily: element.fontFamily ?? 'Gaegu',
                },
              ]}
              value={editText}
              onChangeText={setEditText}
              onBlur={handleTextSubmit}
              onSubmitEditing={handleTextSubmit}
              autoFocus
              multiline
            />
          );
        }
        return (
          <Pressable onLongPress={() => isSelected && setIsEditing(true)}>
            <Text
              style={[
                styles.textContent,
                {
                  fontSize: element.fontSize ?? 18,
                  color: element.color ?? COLORS.textPrimary,
                  fontFamily: element.fontFamily ?? 'Gaegu',
                },
              ]}
            >
              {element.content || '텍스트'}
            </Text>
          </Pressable>
        );

      case 'shape':
        return (
          <View
            style={[
              styles.shapeContent,
              {
                width: element.width - 6,
                height: element.height - 6,
                backgroundColor: element.color ?? COLORS.accent,
                borderRadius:
                  element.content === 'circle'
                    ? element.width / 2
                    : element.content === 'heart'
                      ? element.width / 4
                      : 4,
              },
            ]}
          />
        );

      case 'tape':
        return (
          <View
            style={[
              styles.tapeContent,
              {
                width: element.width,
                height: element.height,
                backgroundColor: element.color ?? COLORS.accent,
              },
            ]}
          />
        );

      default:
        return <Text style={styles.fallbackContent}>{element.content}</Text>;
    }
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.mixElement,
          {
            width: element.width,
            height: element.height,
            zIndex: element.zIndex,
          },
          // 텍스트 타입: Neubrutalism 스타일 테두리
          element.type === 'text' && styles.textElementBorder,
          // 도형 타입: 기본 테두리
          element.type === 'shape' && styles.shapeElementBorder,
          // 테이프: 반투명 효과, 테두리 없음
          element.type === 'tape' && styles.tapeElement,
          // 선택 상태: 파란 테두리
          isSelected && styles.mixElementSelected,
          animatedStyle,
        ]}
      >
        {renderContent()}

        {/* 선택된 요소 삭제 버튼 */}
        {isSelected && (
          <Pressable
            style={styles.deleteButton}
            onPress={() => onDelete(element.id)}
          >
            <Text style={styles.deleteButtonText}>X</Text>
          </Pressable>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// =====================================================
// 메인 MixMatchEditor 컴포넌트
// =====================================================
export default function MixMatchEditor({ captureRef }: { captureRef?: React.RefObject<View | null> }) {
  const project = useProjectStore((s) => s.currentProject);
  const addMixElement = useProjectStore((s) => s.addMixElement);
  const updateMixElement = useProjectStore((s) => s.updateMixElement);
  const removeMixElement = useProjectStore((s) => s.removeMixElement);

  const mixElements = project?.mixElements ?? [];

  // 선택된 요소 ID
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 현재 활성 바텀 탭
  const [activeTab, setActiveTab] = useState<BottomTab>('스티커');
  // 도형 색상 선택 인덱스
  const [shapeColorIndex, setShapeColorIndex] = useState(0);

  // 요소 선택
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // 캔버스 빈 영역 탭 → 선택 해제
  const handleCanvasPress = useCallback(() => {
    setSelectedId(null);
  }, []);

  // 요소 위치 업데이트
  const handlePositionChange = useCallback(
    (id: string, x: number, y: number) => {
      updateMixElement(id, { x, y });
    },
    [updateMixElement]
  );

  // 요소 크기 변경
  const handleScaleChange = useCallback(
    (id: string, width: number, height: number) => {
      updateMixElement(id, { width, height });
    },
    [updateMixElement]
  );

  // 요소 삭제
  const handleDelete = useCallback(
    (id: string) => {
      removeMixElement(id);
      setSelectedId(null);
    },
    [removeMixElement]
  );

  // 텍스트 변경
  const handleTextChange = useCallback(
    (id: string, text: string) => {
      updateMixElement(id, { content: text });
    },
    [updateMixElement]
  );

  // --- 요소 추가 핸들러들 ---

  // 스티커 추가
  const handleAddSticker = useCallback(
    (emoji: string) => {
      const pos = randomCanvasPosition(60, 60);
      const newElement: MixElement = {
        id: generateId(),
        type: 'sticker',
        x: pos.x,
        y: pos.y,
        width: 60,
        height: 60,
        rotation: 0,
        zIndex: mixElements.length + 1,
        locked: false,
        opacity: 1,
        content: emoji,
      };
      addMixElement(newElement);
    },
    [addMixElement, mixElements.length]
  );

  // 텍스트 추가
  const handleAddText = useCallback(() => {
    const pos = randomCanvasPosition(140, 50);
    const newElement: MixElement = {
      id: generateId(),
      type: 'text',
      x: pos.x,
      y: pos.y,
      width: 140,
      height: 50,
      rotation: 0,
      zIndex: mixElements.length + 1,
      locked: false,
      opacity: 1,
      content: '텍스트',
      color: COLORS.textPrimary,
      fontSize: 18,
      fontFamily: 'Gaegu',
    };
    addMixElement(newElement);
  }, [addMixElement, mixElements.length]);

  // 도형 추가
  const handleAddShape = useCallback(
    (shape: string) => {
      const size = shape === 'circle' ? 60 : 56;
      const pos = randomCanvasPosition(size, size);
      const newElement: MixElement = {
        id: generateId(),
        type: 'shape',
        x: pos.x,
        y: pos.y,
        width: size,
        height: size,
        rotation: 0,
        zIndex: mixElements.length + 1,
        locked: false,
        opacity: 1,
        content: shape, // circle, rect, heart, star
        color: SHAPE_COLORS[shapeColorIndex],
      };
      addMixElement(newElement);
    },
    [addMixElement, mixElements.length, shapeColorIndex]
  );

  // 테이프 추가
  const handleAddTape = useCallback(
    (color: string) => {
      const pos = randomCanvasPosition(160, 28);
      const newElement: MixElement = {
        id: generateId(),
        type: 'tape',
        x: pos.x,
        y: pos.y,
        width: 160,
        height: 28,
        rotation: (Math.random() - 0.5) * 20, // 약간 기울어진 느낌
        zIndex: mixElements.length + 1,
        locked: false,
        opacity: 0.7,
        content: 'tape',
        color,
      };
      addMixElement(newElement);
    },
    [addMixElement, mixElements.length]
  );

  // --- zIndex 조절 ---
  const handleBringForward = useCallback(() => {
    if (!selectedId) return;
    const maxZ = Math.max(...mixElements.map((el) => el.zIndex), 0);
    updateMixElement(selectedId, { zIndex: maxZ + 1 });
  }, [selectedId, mixElements, updateMixElement]);

  const handleSendBackward = useCallback(() => {
    if (!selectedId) return;
    const minZ = Math.min(...mixElements.map((el) => el.zIndex), 1);
    updateMixElement(selectedId, { zIndex: Math.max(minZ - 1, 0) });
  }, [selectedId, mixElements, updateMixElement]);

  // ===================================================
  // 렌더링
  // ===================================================
  return (
    <View style={styles.container}>
      {/* 캔버스 영역 */}
      <Pressable style={styles.canvasWrapper} onPress={handleCanvasPress}>
        <View ref={captureRef} collapsable={false} style={styles.canvas}>
          {/* 빈 캔버스 안내 */}
          {mixElements.length === 0 && (
            <View style={styles.emptyGuide}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyText}>아래에서 요소를 추가하세요</Text>
            </View>
          )}

          {/* 요소 렌더링 */}
          {mixElements.map((el) => (
            <DraggableMixElement
              key={el.id}
              element={el}
              isSelected={selectedId === el.id}
              onSelect={handleSelect}
              onPositionChange={handlePositionChange}
              onScaleChange={handleScaleChange}
              onDelete={handleDelete}
              onTextChange={handleTextChange}
            />
          ))}
        </View>
      </Pressable>

      {/* 레이어 관리 버튼 (선택된 요소가 있을 때만) */}
      {selectedId && (
        <View style={styles.layerControls}>
          <Pressable style={styles.layerButton} onPress={handleBringForward}>
            <Text style={styles.layerButtonText}>앞으로</Text>
          </Pressable>
          <Pressable style={styles.layerButton} onPress={handleSendBackward}>
            <Text style={styles.layerButtonText}>뒤로</Text>
          </Pressable>
        </View>
      )}

      {/* 바텀 영역 — 요소 추가 탭 */}
      <View style={styles.bottomArea}>
        {/* 탭 바 */}
        <View style={styles.tabBar}>
          {BOTTOM_TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 탭 콘텐츠 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContentInner}
          style={styles.tabContent}
        >
          {/* 스티커 탭 */}
          {activeTab === '스티커' && (
            <View style={styles.gridContent}>
              {STICKER_EMOJIS.map((emoji, idx) => (
                <Pressable
                  key={idx}
                  style={styles.stickerChip}
                  onPress={() => handleAddSticker(emoji)}
                >
                  <Text style={styles.stickerChipEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* 텍스트 탭 */}
          {activeTab === '텍스트' && (
            <View style={styles.textTabContent}>
              <Pressable style={styles.addTextButton} onPress={handleAddText}>
                <Text style={styles.addTextButtonLabel}>+ 텍스트 추가</Text>
              </Pressable>
              <Text style={styles.textHint}>
                추가 후 길게 눌러 편집할 수 있어요
              </Text>
            </View>
          )}

          {/* 도형 탭 */}
          {activeTab === '도형' && (
            <View style={styles.shapeTabContent}>
              {/* 도형 선택 */}
              <View style={styles.shapeRow}>
                {SHAPES.map((s) => (
                  <Pressable
                    key={s.shape}
                    style={styles.shapeChip}
                    onPress={() => handleAddShape(s.shape)}
                  >
                    <Text style={styles.shapeChipEmoji}>{s.emoji}</Text>
                    <Text style={styles.shapeChipLabel}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>
              {/* 도형 색상 선택 */}
              <View style={styles.shapeColorRow}>
                {SHAPE_COLORS.map((color, idx) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.shapeColorChip,
                      { backgroundColor: color },
                      shapeColorIndex === idx && styles.shapeColorChipActive,
                    ]}
                    onPress={() => setShapeColorIndex(idx)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 테이프 탭 */}
          {activeTab === '테이프' && (
            <View style={styles.tapeTabContent}>
              {TAPE_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={styles.tapeChip}
                  onPress={() => handleAddTape(color)}
                >
                  <View
                    style={[styles.tapePreview, { backgroundColor: color }]}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// =====================================================
// 스타일
// =====================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.editorBg,
  },

  // --- 캔버스 ---
  canvasWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  canvas: {
    width: '100%',
    aspectRatio: 393 / 852,
    maxWidth: CANVAS_WIDTH,
    backgroundColor: COLORS.background,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },

  // --- 빈 캔버스 안내 ---
  emptyGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: 'Gaegu',
    fontSize: 17,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // --- 드래그 가능한 믹스 요소 ---
  mixElement: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mixElementSelected: {
    borderWidth: 2,
    borderColor: '#4A90D9',
    borderStyle: 'dashed',
    borderRadius: 4,
  },

  // 스티커 렌더링
  stickerContent: {
    fontSize: 40,
    textAlign: 'center',
  },

  // 텍스트 렌더링 — Neubrutalism 테두리
  textElementBorder: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 5,
    backgroundColor: '#FFFFFFCC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  textContent: {
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    textAlign: 'center',
    padding: 0,
  },

  // 도형 렌더링
  shapeElementBorder: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
  },
  shapeContent: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
  },

  // 테이프 렌더링 — 반투명 마스킹 테이프
  tapeElement: {
    borderWidth: 0,
    overflow: 'visible',
  },
  tapeContent: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 3,
    // 테이프 가장자리 — 살짝 들쭉날쭉한 느낌
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // 폴백 렌더링
  fallbackContent: {
    fontFamily: 'Gaegu',
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  // --- 삭제 버튼 ---
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  deleteButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 14,
  },

  // --- 레이어 관리 ---
  layerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  layerButton: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 5,
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: 16,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  layerButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  // --- 바텀 영역 ---
  bottomArea: {
    backgroundColor: COLORS.background,
    borderTopWidth: 2.5,
    borderTopColor: COLORS.border,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },

  // 탭 바
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 6,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: COLORS.accent,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    // Neubrutalism 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },

  // 탭 콘텐츠
  tabContent: {
    minHeight: 90,
    maxHeight: 120,
    paddingHorizontal: 12,
  },
  tabContentInner: {
    alignItems: 'flex-start',
    paddingRight: 20,
  },

  // --- 스티커 탭 ---
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  stickerChip: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  stickerChipEmoji: {
    fontSize: 24,
  },

  // --- 텍스트 탭 ---
  textTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  addTextButton: {
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  addTextButtonLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  textHint: {
    fontFamily: 'Gaegu',
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // --- 도형 탭 ---
  shapeTabContent: {
    gap: 10,
    paddingVertical: 4,
  },
  shapeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shapeChip: {
    width: 60,
    height: 60,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 6,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  shapeChipEmoji: {
    fontSize: 22,
  },
  shapeChipLabel: {
    fontFamily: 'Gaegu',
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  shapeColorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shapeColorChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  shapeColorChipActive: {
    borderWidth: 3,
    borderColor: '#4A90D9',
    // 활성 섀도우
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },

  // --- 테이프 탭 ---
  tapeTabContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
  },
  tapeChip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tapePreview: {
    width: 80,
    height: 28,
    opacity: 0.75,
  },
});
