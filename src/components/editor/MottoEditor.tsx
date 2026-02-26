import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { COLORS } from '@/constants';
import {
  useProjectStore,
  MottoTemplate,
  MottoData,
} from '@/stores/useProjectStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- 상수 ---

// 템플릿 목록 (8가지)
const TEMPLATES: { key: MottoTemplate; label: string; emoji: string }[] = [
  { key: 'center', label: '중앙', emoji: '📝' },
  { key: 'bubble', label: '말풍선', emoji: '💬' },
  { key: 'postit', label: '포스트잇', emoji: '📌' },
  { key: 'typewriter', label: '타자기', emoji: '⌨️' },
  { key: 'notebook', label: '줄노트', emoji: '📓' },
  { key: 'stamp', label: '도장', emoji: '📮' },
  { key: 'neon', label: '네온', emoji: '✨' },
  { key: 'collage', label: '콜라주', emoji: '🎨' },
];

// 텍스트 색상 팔레트
const COLOR_PALETTE = [
  '#1A1A1A',
  '#FFFFFF',
  '#FF91AD',
  '#91D0FF',
  '#FFDE59',
  '#F0FFF4',
  '#E6F3FF',
];

// 폰트 옵션
const FONT_OPTIONS: { key: string; label: string }[] = [
  { key: 'Gaegu', label: '개구체' },
  { key: 'Gaegu-Bold', label: '개구 볼드' },
  { key: 'System', label: '고딕' },
  { key: 'serif', label: '명조' },
];

// 정렬 옵션
const ALIGN_OPTIONS: { key: 'left' | 'center' | 'right'; label: string }[] = [
  { key: 'left', label: '좌' },
  { key: 'center', label: '중' },
  { key: 'right', label: '우' },
];

// 강조 스타일 옵션
const EMPHASIS_OPTIONS: {
  key: 'underline' | 'highlight' | 'circle' | undefined;
  label: string;
}[] = [
  { key: undefined, label: '없음' },
  { key: 'underline', label: '밑줄' },
  { key: 'highlight', label: '형광펜' },
  { key: 'circle', label: '동그라미' },
];

// 콜라주 주변 이모지 배치 (상대 위치)
const COLLAGE_EMOJIS = [
  { emoji: '⭐', top: 8, left: 10 },
  { emoji: '🌸', top: 12, right: 15 },
  { emoji: '💫', bottom: 20, left: 20 },
  { emoji: '🎵', bottom: 15, right: 10 },
  { emoji: '❤️', top: 50, left: 5 },
  { emoji: '✨', top: 45, right: 8 },
];

// --- 메인 컴포넌트 ---

export default function MottoEditor({ captureRef }: { captureRef?: React.RefObject<View | null> }) {
  const project = useProjectStore((s) => s.currentProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);

  // 모토 데이터 (없으면 기본값)
  const mottoData: MottoData = project?.mottoData ?? {
    template: 'center',
    texts: [
      {
        id: '1',
        content: '오늘도 화이팅!',
        fontSize: 32,
        color: '#1A1A1A',
        align: 'center',
        rotation: 0,
        position: { x: 0.5, y: 0.5 },
      },
    ],
  };

  // 현재 편집 중인 첫 번째 텍스트 (주 텍스트)
  const currentText = mottoData.texts[0];

  // 편집 패널 토글 상태
  const [showColorPicker, setShowColorPicker] = useState(false);

  // 모토 데이터 업데이트 헬퍼
  const updateMotto = useCallback(
    (updates: Partial<MottoData>) => {
      updateCurrentProject({
        mottoData: { ...mottoData, ...updates },
      });
    },
    [mottoData, updateCurrentProject],
  );

  // 텍스트 속성 업데이트 헬퍼
  const updateText = useCallback(
    (updates: Partial<typeof currentText>) => {
      const newTexts = mottoData.texts.map((t, i) =>
        i === 0 ? { ...t, ...updates } : t,
      );
      updateMotto({ texts: newTexts });
    },
    [mottoData.texts, updateMotto],
  );

  // 템플릿 변경
  const handleTemplateChange = useCallback(
    (template: MottoTemplate) => {
      updateMotto({ template });
    },
    [updateMotto],
  );

  // 텍스트 내용 변경
  const handleTextChange = useCallback(
    (content: string) => {
      updateText({ content });
    },
    [updateText],
  );

  // 폰트 크기 변경 (슬라이더 대체: +/- 버튼)
  const handleFontSizeChange = useCallback(
    (delta: number) => {
      const newSize = Math.max(12, Math.min(64, currentText.fontSize + delta));
      updateText({ fontSize: newSize });
    },
    [currentText.fontSize, updateText],
  );

  // 색상 변경
  const handleColorChange = useCallback(
    (color: string) => {
      updateText({ color });
      setShowColorPicker(false);
    },
    [updateText],
  );

  // 폰트 변경
  const handleFontChange = useCallback(
    (fontFamily: string) => {
      updateText({ fontFamily });
    },
    [updateText],
  );

  // 정렬 변경
  const handleAlignChange = useCallback(
    (align: 'left' | 'center' | 'right') => {
      updateText({ align });
    },
    [updateText],
  );

  // 강조 스타일 변경
  const handleEmphasisChange = useCallback(
    (emphasis: 'underline' | 'highlight' | 'circle' | undefined) => {
      updateText({ emphasis });
    },
    [updateText],
  );

  return (
    <View style={styles.container}>
      {/* 프리뷰 영역 */}
      <View ref={captureRef} collapsable={false} style={styles.previewArea}>
        <TemplatePreview
          template={mottoData.template}
          text={currentText.content}
          fontSize={currentText.fontSize}
          color={currentText.color}
          align={currentText.align}
          emphasis={currentText.emphasis}
        />
      </View>

      {/* 템플릿 선택 (가로 스크롤) */}
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionLabel}>템플릿</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templateScroll}
        >
          {TEMPLATES.map((tmpl) => {
            const isActive = mottoData.template === tmpl.key;
            return (
              <Pressable
                key={tmpl.key}
                onPress={() => handleTemplateChange(tmpl.key)}
                style={[
                  styles.templateChip,
                  isActive && styles.templateChipActive,
                ]}
              >
                <Text style={styles.templateEmoji}>{tmpl.emoji}</Text>
                <Text
                  style={[
                    styles.templateLabel,
                    isActive && styles.templateLabelActive,
                  ]}
                >
                  {tmpl.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 문구 편집 */}
      <ScrollView
        style={styles.editScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.editScrollContent}
      >
        {/* 텍스트 입력 */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>문구 입력</Text>
          <TextInput
            style={styles.textInput}
            value={currentText.content}
            onChangeText={handleTextChange}
            multiline
            placeholder="문구를 입력하세요..."
            placeholderTextColor={COLORS.textMuted}
            textAlignVertical="top"
          />
        </View>

        {/* 폰트 크기 조절 */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>
            글자 크기: {currentText.fontSize}px
          </Text>
          <View style={styles.fontSizeRow}>
            <Pressable
              onPress={() => handleFontSizeChange(-2)}
              style={styles.fontSizeBtn}
            >
              <Text style={styles.fontSizeBtnText}>A-</Text>
            </Pressable>
            {/* 슬라이더 영역 (시각적 바) */}
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${((currentText.fontSize - 12) / (64 - 12)) * 100}%`,
                  },
                ]}
              />
            </View>
            <Pressable
              onPress={() => handleFontSizeChange(2)}
              style={styles.fontSizeBtn}
            >
              <Text style={styles.fontSizeBtnText}>A+</Text>
            </Pressable>
          </View>
        </View>

        {/* 폰트 선택 */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>폰트</Text>
          <View style={styles.fontRow}>
            {FONT_OPTIONS.map((f) => {
              const isActive = (currentText.fontFamily ?? 'Gaegu') === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => handleFontChange(f.key)}
                  style={[
                    styles.fontChip,
                    isActive && styles.fontChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.fontChipText,
                      { fontFamily: f.key === 'System' ? undefined : f.key },
                      isActive && styles.fontChipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 텍스트 색상 선택 */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>글자 색상</Text>
          <View style={styles.colorRow}>
            {COLOR_PALETTE.map((color) => {
              const isActive = currentText.color === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => handleColorChange(color)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    isActive && styles.colorCircleActive,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* 정렬 */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>정렬</Text>
          <View style={styles.alignRow}>
            {ALIGN_OPTIONS.map((opt) => {
              const isActive = currentText.align === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handleAlignChange(opt.key)}
                  style={[
                    styles.alignBtn,
                    isActive && styles.alignBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.alignBtnText,
                      isActive && styles.alignBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 텍스트 회전 */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>
            기울기: {currentText.rotation}°
          </Text>
          <View style={styles.fontSizeRow}>
            <Pressable
              onPress={() => updateText({ rotation: Math.max(-45, currentText.rotation - 5) })}
              style={styles.fontSizeBtn}
            >
              <Text style={styles.fontSizeBtnText}>-5</Text>
            </Pressable>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${((currentText.rotation + 45) / 90) * 100}%`,
                  },
                ]}
              />
            </View>
            <Pressable
              onPress={() => updateText({ rotation: Math.min(45, currentText.rotation + 5) })}
              style={styles.fontSizeBtn}
            >
              <Text style={styles.fontSizeBtnText}>+5</Text>
            </Pressable>
          </View>
          {currentText.rotation !== 0 && (
            <Pressable
              onPress={() => updateText({ rotation: 0 })}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>초기화</Text>
            </Pressable>
          )}
        </View>

        {/* 강조 스타일 */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>강조 스타일</Text>
          <View style={styles.emphasisRow}>
            {EMPHASIS_OPTIONS.map((opt) => {
              const isActive = currentText.emphasis === opt.key;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => handleEmphasisChange(opt.key)}
                  style={[
                    styles.emphasisBtn,
                    isActive && styles.emphasisBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.emphasisBtnText,
                      isActive && styles.emphasisBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// --- 템플릿별 프리뷰 렌더링 ---

interface TemplatePreviewProps {
  template: MottoTemplate;
  text: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  emphasis?: 'underline' | 'highlight' | 'circle';
}

function TemplatePreview({
  template,
  text,
  fontSize,
  color,
  align,
  emphasis,
}: TemplatePreviewProps) {
  // 강조 스타일이 적용된 텍스트 컴포넌트
  const renderStyledText = (overrideStyle?: object) => (
    <View style={styles.emphasisWrapper}>
      {/* 형광펜 배경 */}
      {emphasis === 'highlight' && <View style={styles.highlightBg} />}
      {/* 동그라미 테두리 */}
      {emphasis === 'circle' && <View style={styles.circleBorder} />}
      <Text
        style={[
          styles.previewText,
          {
            fontSize,
            color,
            textAlign: align,
            textDecorationLine:
              emphasis === 'underline' ? 'underline' : 'none',
            textDecorationColor: color,
          },
          overrideStyle,
        ]}
      >
        {text || '문구를 입력하세요'}
      </Text>
    </View>
  );

  switch (template) {
    // 1. 중앙 — 화면 중앙에 크게 한 줄
    case 'center':
      return (
        <View style={styles.previewCenter}>{renderStyledText()}</View>
      );

    // 2. 말풍선 — 만화 말풍선 안에 텍스트
    case 'bubble':
      return (
        <View style={styles.previewBubbleWrap}>
          <View style={styles.previewBubble}>
            {renderStyledText()}
            {/* 말풍선 꼬리 */}
            <View style={styles.bubbleTail} />
          </View>
        </View>
      );

    // 3. 포스트잇 — 노란 배경, 살짝 회전
    case 'postit':
      return (
        <View style={styles.previewPostitWrap}>
          <View style={styles.previewPostit}>
            {renderStyledText({ color: '#1A1A1A' })}
          </View>
        </View>
      );

    // 4. 타자기 — 모노스페이스 느낌, 박스형
    case 'typewriter':
      return (
        <View style={styles.previewTypewriterWrap}>
          <View style={styles.previewTypewriter}>
            {renderStyledText({
              fontFamily: 'Courier',
              letterSpacing: 1.5,
            })}
          </View>
        </View>
      );

    // 5. 줄노트 — 줄 배경 + 텍스트
    case 'notebook':
      return (
        <View style={styles.previewNotebookWrap}>
          <View style={styles.previewNotebook}>
            {/* 줄 배경 (반복 borderBottom, 28px 간격) */}
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[styles.notebookLine, { top: 28 * (i + 1) }]}
              />
            ))}
            {/* 빨간 세로줄 */}
            <View style={styles.notebookRedLine} />
            <View style={styles.notebookTextWrap}>
              {renderStyledText()}
            </View>
          </View>
        </View>
      );

    // 6. 도장 — 이중 테두리 + 텍스트
    case 'stamp':
      return (
        <View style={styles.previewStampWrap}>
          <View style={styles.previewStampOuter}>
            <View style={styles.previewStampInner}>
              {renderStyledText({
                fontFamily: 'Gaegu-Bold',
                textTransform: 'uppercase',
              })}
            </View>
          </View>
        </View>
      );

    // 7. 네온 — 글로우 효과 (textShadow)
    case 'neon':
      return (
        <View style={styles.previewNeonWrap}>
          {renderStyledText({
            color: '#FF91AD',
            textShadowColor: '#FF91AD',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 12,
            fontFamily: 'Gaegu-Bold',
          })}
          {/* 겹치는 레이어로 글로우 강화 */}
          <Text
            style={[
              styles.previewText,
              styles.neonGlowLayer,
              {
                fontSize,
                textAlign: align,
              },
            ]}
          >
            {text || '문구를 입력하세요'}
          </Text>
        </View>
      );

    // 8. 콜라주 — 주변에 이모지 배치 + 중앙 텍스트
    case 'collage':
      return (
        <View style={styles.previewCollageWrap}>
          {/* 주변 이모지들 */}
          {COLLAGE_EMOJIS.map((item, i) => (
            <Text
              key={i}
              style={[
                styles.collageEmoji,
                {
                  ...(item.top !== undefined && { top: item.top }),
                  ...(item.bottom !== undefined && { bottom: item.bottom }),
                  ...(item.left !== undefined && { left: item.left }),
                  ...(item.right !== undefined && { right: item.right }),
                },
              ]}
            >
              {item.emoji}
            </Text>
          ))}
          {/* 중앙 텍스트 */}
          {renderStyledText()}
        </View>
      );

    default:
      return (
        <View style={styles.previewCenter}>{renderStyledText()}</View>
      );
  }
}

// --- 스타일 ---

const styles = StyleSheet.create({
  // 전체 컨테이너
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // 프리뷰 영역
  previewArea: {
    height: 220,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 8,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    // Neubrutalism 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  // 섹션 래퍼
  sectionWrapper: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  // 템플릿 스크롤
  templateScroll: {
    paddingRight: 16,
    gap: 10,
  },
  templateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 6,
    backgroundColor: COLORS.surface,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  templateChipActive: {
    backgroundColor: COLORS.accent,
    // 눌린 느낌 (약간 축소된 섀도우)
    shadowOffset: { width: 2, height: 2 },
  },
  templateEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  templateLabel: {
    fontFamily: 'Gaegu',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  templateLabelActive: {
    fontFamily: 'Gaegu-Bold',
    color: COLORS.textPrimary,
  },

  // 편집 스크롤 영역
  editScroll: {
    flex: 1,
  },
  editScrollContent: {
    paddingBottom: 40,
  },

  // 텍스트 입력
  textInput: {
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 8,
    backgroundColor: COLORS.surface,
    fontFamily: 'Gaegu',
    fontSize: 18,
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // 폰트 크기 조절
  fontRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fontChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  fontChipActive: {
    backgroundColor: COLORS.accent,
  },
  fontChipText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  fontChipTextActive: {
    fontWeight: '700' as const,
  },
  resetBtn: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    marginTop: 6,
  },
  resetBtnText: {
    fontFamily: 'Gaegu',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fontSizeBtn: {
    width: 44,
    height: 44,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 5,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  fontSizeBtnText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },

  // 색상 선택
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: COLORS.border,
  },
  colorCircleActive: {
    // 활성 색상 강조 — 큰 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    transform: [{ scale: 1.15 }],
  },

  // 정렬 버튼
  alignRow: {
    flexDirection: 'row',
    gap: 8,
  },
  alignBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 5,
    backgroundColor: COLORS.surface,
  },
  alignBtnActive: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  alignBtnText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  alignBtnTextActive: {
    color: COLORS.textPrimary,
  },

  // 강조 스타일
  emphasisRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  emphasisBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 5,
    backgroundColor: COLORS.surface,
  },
  emphasisBtnActive: {
    backgroundColor: COLORS.blockBlueLght,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  emphasisBtnText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emphasisBtnTextActive: {
    color: COLORS.textPrimary,
  },

  // --- 공통 프리뷰 텍스트 ---
  previewText: {
    fontFamily: 'Gaegu-Bold',
    zIndex: 1,
  },

  // 강조 효과 래퍼
  emphasisWrapper: {
    position: 'relative',
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // 형광펜 배경
  highlightBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '15%',
    height: '45%',
    backgroundColor: 'rgba(255, 222, 89, 0.5)',
    borderRadius: 2,
    transform: [{ rotate: '-0.5deg' }],
    zIndex: 0,
  },
  // 동그라미 테두리
  circleBorder: {
    position: 'absolute',
    top: -6,
    left: -10,
    right: -10,
    bottom: -6,
    borderWidth: 2.5,
    borderColor: '#FF91AD',
    borderRadius: 999,
    transform: [{ rotate: '-2deg' }],
    zIndex: 0,
  },

  // --- 템플릿별 프리뷰 스타일 ---

  // 1. center: 중앙 배치
  previewCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  // 2. bubble: 말풍선
  previewBubbleWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewBubble: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: '90%',
    // Neubrutalism 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -14,
    left: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 0,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.border,
  },

  // 3. postit: 포스트잇
  previewPostitWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewPostit: {
    backgroundColor: COLORS.accent,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    width: '80%',
    paddingHorizontal: 16,
    paddingVertical: 18,
    transform: [{ rotate: '-3deg' }],
    // 약간 삐뚤빼뚤한 borderRadius
    borderTopLeftRadius: 2,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 10,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  // 4. typewriter: 타자기
  previewTypewriterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewTypewriter: {
    backgroundColor: '#FAFAF8',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: '90%',
    // 타자기 느낌 — 상단 장식 라인
    borderTopWidth: 4,
  },

  // 5. notebook: 줄노트
  previewNotebookWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  previewNotebook: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    width: '90%',
    paddingHorizontal: 30,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  notebookLine: {
    position: 'absolute',
    left: 28,
    right: 0,
    height: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  notebookRedLine: {
    position: 'absolute',
    left: 24,
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 1.5,
    borderLeftColor: '#F87171',
  },
  notebookTextWrap: {
    zIndex: 1,
  },

  // 6. stamp: 도장/우표
  previewStampWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewStampOuter: {
    borderWidth: 3,
    borderColor: '#FF91AD',
    borderRadius: 8,
    padding: 5,
    transform: [{ rotate: '-5deg' }],
  },
  previewStampInner: {
    borderWidth: 2,
    borderColor: '#FF91AD',
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },

  // 7. neon: 네온 글로우
  previewNeonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  neonGlowLayer: {
    position: 'absolute',
    color: 'transparent',
    textShadowColor: 'rgba(255, 145, 173, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
    fontFamily: 'Gaegu-Bold',
  },

  // 8. collage: 콜라주
  previewCollageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  collageEmoji: {
    position: 'absolute',
    fontSize: 24,
    // 랜덤 느낌 회전은 각각 다르게 적용
    transform: [{ rotate: '5deg' }],
  },
});
