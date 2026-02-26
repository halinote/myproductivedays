import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS } from '@/constants';
import { useProjectStore, LifeDesignType } from '@/stores/useProjectStore';

// ────────────────────────────────────────
// 상수
// ────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 색상 팔레트 (채워진 영역 / 남은 영역 선택용)
const COLOR_PALETTE = [
  '#FFDE59',
  '#91D0FF',
  '#FF91AD',
  '#F0FFF4',
  '#FFD6E0',
  '#C1F0C1',
];

// 디자인 타입 목록
const DESIGN_TYPES: { key: LifeDesignType; label: string; emoji: string }[] = [
  { key: 'bar', label: '프로그레스바', emoji: '📊' },
  { key: 'dots', label: '주 단위 점', emoji: '⚬' },
  { key: 'tree', label: '나무 성장', emoji: '🌳' },
  { key: 'book', label: '책 페이지', emoji: '📖' },
  { key: 'moon', label: '달 위상', emoji: '🌙' },
  { key: 'pixel', label: '픽셀 격자', emoji: '▦' },
];

// 표시 단위 목록
const DISPLAY_UNITS: { key: 'year' | 'month' | 'week' | 'day'; label: string }[] = [
  { key: 'year', label: '년' },
  { key: 'month', label: '월' },
  { key: 'week', label: '주' },
  { key: 'day', label: '일' },
];

// ────────────────────────────────────────
// 유틸: 진행률 계산
// ────────────────────────────────────────
interface LifeStats {
  /** 0 ~ 1 진행 비율 */
  progress: number;
  /** 경과 시간 (단위별) */
  elapsed: number;
  /** 남은 시간 (단위별) */
  remaining: number;
  /** 전체 시간 (단위별) */
  total: number;
  /** 단위 라벨 */
  unitLabel: string;
  /** 퍼센트 문자열 */
  percentText: string;
}

function calcLifeStats(
  birthDate: string,
  expectedLifespan: number,
  displayUnit: 'year' | 'month' | 'week' | 'day',
): LifeStats {
  const now = new Date();
  const birth = new Date(birthDate);

  // 유효하지 않은 날짜 처리
  if (isNaN(birth.getTime())) {
    return {
      progress: 0,
      elapsed: 0,
      remaining: 0,
      total: 0,
      unitLabel: '',
      percentText: '0%',
    };
  }

  const msPerDay = 86_400_000;
  const elapsedMs = Math.max(0, now.getTime() - birth.getTime());
  const totalMs = expectedLifespan * 365.25 * msPerDay;
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const progress = Math.min(1, Math.max(0, elapsedMs / totalMs));

  // 단위 변환 계수
  const unitMap: Record<string, { divisor: number; label: string }> = {
    year: { divisor: 365.25 * msPerDay, label: '년' },
    month: { divisor: 30.4375 * msPerDay, label: '개월' },
    week: { divisor: 7 * msPerDay, label: '주' },
    day: { divisor: msPerDay, label: '일' },
  };

  const { divisor, label } = unitMap[displayUnit];
  const elapsed = Math.floor(elapsedMs / divisor);
  const remaining = Math.max(0, Math.floor(remainingMs / divisor));
  const total = Math.floor(totalMs / divisor);

  return {
    progress,
    elapsed,
    remaining,
    total,
    unitLabel: label,
    percentText: `${(progress * 100).toFixed(1)}%`,
  };
}

// ────────────────────────────────────────
// 디자인별 프리뷰 렌더러
// ────────────────────────────────────────

/** 가로 프로그레스바 */
function BarPreview({
  stats,
  filledColor,
  remainingColor,
}: {
  stats: LifeStats;
  filledColor: string;
  remainingColor: string;
}) {
  return (
    <View style={previewStyles.barContainer}>
      <Text style={previewStyles.percentBig}>{stats.percentText}</Text>
      <View style={[previewStyles.barTrack, { backgroundColor: remainingColor }]}>
        <View
          style={[
            previewStyles.barFill,
            {
              width: `${Math.min(100, stats.progress * 100)}%`,
              backgroundColor: filledColor,
            },
          ]}
        />
      </View>
      <View style={previewStyles.statsRow}>
        <Text style={previewStyles.statsText}>
          경과 {stats.elapsed}{stats.unitLabel}
        </Text>
        <Text style={previewStyles.statsText}>
          남은 {stats.remaining}{stats.unitLabel}
        </Text>
      </View>
    </View>
  );
}

/** 주 단위 점 (4160주 = 80년 기준, 축소 표시) */
function DotsPreview({
  stats,
  filledColor,
  remainingColor,
}: {
  stats: LifeStats;
  filledColor: string;
  remainingColor: string;
}) {
  // 전체 주 수 계산 (예상 수명 기반)
  const totalWeeks = stats.total > 0
    ? Math.round(stats.total * (stats.unitLabel === '주' ? 1 : stats.unitLabel === '일' ? 1/7 : stats.unitLabel === '개월' ? 4.345 : 52.18))
    : 4160;
  const filledWeeks = Math.round(totalWeeks * stats.progress);

  // 축소 표시: 전체를 50x20 그리드(1000 블록)으로 대표
  const gridCols = 50;
  const gridRows = 20;
  const totalCells = gridCols * gridRows;
  const filledCells = Math.round((filledWeeks / totalWeeks) * totalCells);

  return (
    <View style={previewStyles.dotsContainer}>
      <Text style={previewStyles.percentBig}>{stats.percentText}</Text>
      <View style={previewStyles.dotsGrid}>
        {Array.from({ length: gridRows }, (_, row) => (
          <View key={row} style={previewStyles.dotsRow}>
            {Array.from({ length: gridCols }, (_, col) => {
              const idx = row * gridCols + col;
              return (
                <View
                  key={col}
                  style={[
                    previewStyles.dot,
                    {
                      backgroundColor: idx < filledCells ? filledColor : remainingColor,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <Text style={previewStyles.dotsCaption}>
        {filledWeeks.toLocaleString()}주 경과 / {totalWeeks.toLocaleString()}주
      </Text>
    </View>
  );
}

/** 나무 성장 이모지 */
function TreePreview({ stats }: { stats: LifeStats }) {
  const stages = ['🌱', '🌿', '🌳', '🍂'];
  const stageIndex = Math.min(3, Math.floor(stats.progress * 4));
  const stageLabels = ['새싹', '성장', '전성기', '가을'];

  return (
    <View style={previewStyles.treeContainer}>
      <Text style={previewStyles.treeEmoji}>{stages[stageIndex]}</Text>
      <Text style={previewStyles.treeLabel}>{stageLabels[stageIndex]}</Text>
      <Text style={previewStyles.percentMedium}>{stats.percentText}</Text>
      <View style={previewStyles.statsRow}>
        <Text style={previewStyles.statsText}>
          경과 {stats.elapsed}{stats.unitLabel}
        </Text>
        <Text style={previewStyles.statsText}>
          남은 {stats.remaining}{stats.unitLabel}
        </Text>
      </View>
    </View>
  );
}

/** 책 페이지 비유 */
function BookPreview({ stats }: { stats: LifeStats }) {
  // 챕터 계산 (10개 챕터로 나누기)
  const totalChapters = 10;
  const currentChapter = Math.min(totalChapters, Math.ceil(stats.progress * totalChapters));
  const currentPage = stats.elapsed;
  const totalPages = stats.total;

  return (
    <View style={previewStyles.bookContainer}>
      <Text style={previewStyles.bookEmoji}>📖</Text>
      <Text style={previewStyles.bookChapter}>
        Chapter {currentChapter} / {totalChapters}
      </Text>
      <Text style={previewStyles.percentMedium}>{stats.percentText}</Text>
      <Text style={previewStyles.statsText}>
        {currentPage.toLocaleString()}p / {totalPages.toLocaleString()}p ({stats.unitLabel})
      </Text>
    </View>
  );
}

/** 달 위상 */
function MoonPreview({ stats }: { stats: LifeStats }) {
  const phases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const phaseIndex = Math.min(7, Math.floor(stats.progress * 8));

  return (
    <View style={previewStyles.moonContainer}>
      <Text style={previewStyles.moonEmoji}>{phases[phaseIndex]}</Text>
      <Text style={previewStyles.percentMedium}>{stats.percentText}</Text>
      <View style={previewStyles.statsRow}>
        <Text style={previewStyles.statsText}>
          경과 {stats.elapsed}{stats.unitLabel}
        </Text>
        <Text style={previewStyles.statsText}>
          남은 {stats.remaining}{stats.unitLabel}
        </Text>
      </View>
    </View>
  );
}

/** 픽셀 격자 */
function PixelPreview({
  stats,
  filledColor,
  remainingColor,
}: {
  stats: LifeStats;
  filledColor: string;
  remainingColor: string;
}) {
  const gridSize = 10; // 10x10 격자
  const totalCells = gridSize * gridSize;
  const filledCells = Math.round(stats.progress * totalCells);

  return (
    <View style={previewStyles.pixelContainer}>
      <Text style={previewStyles.percentBig}>{stats.percentText}</Text>
      <View style={previewStyles.pixelGrid}>
        {Array.from({ length: gridSize }, (_, row) => (
          <View key={row} style={previewStyles.pixelRow}>
            {Array.from({ length: gridSize }, (_, col) => {
              const idx = row * gridSize + col;
              return (
                <View
                  key={col}
                  style={[
                    previewStyles.pixelCell,
                    {
                      backgroundColor: idx < filledCells ? filledColor : remainingColor,
                      borderColor: COLORS.border,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={previewStyles.statsRow}>
        <Text style={previewStyles.statsText}>
          경과 {stats.elapsed}{stats.unitLabel}
        </Text>
        <Text style={previewStyles.statsText}>
          남은 {stats.remaining}{stats.unitLabel}
        </Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────
// 메인 컴포넌트
// ────────────────────────────────────────
export default function LifeProgressEditor({ captureRef }: { captureRef?: React.RefObject<View | null> }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);

  // 라이프 프로그레스 데이터
  const data = currentProject?.lifeProgressData;

  // 색상 선택 대상 ("filled" or "remaining")
  const [colorTarget, setColorTarget] = useState<'filled' | 'remaining'>('filled');

  // 데이터 업데이트 헬퍼
  const update = useCallback(
    (partial: Partial<NonNullable<typeof data>>) => {
      if (!data) return;
      updateCurrentProject({
        lifeProgressData: { ...data, ...partial },
      });
    },
    [data, updateCurrentProject],
  );

  // 진행률 계산 (메모이제이션)
  const stats = useMemo(
    () => data
      ? calcLifeStats(data.birthDate, data.expectedLifespan, data.displayUnit)
      : calcLifeStats('2000-01-01', 80, 'year'),
    [data?.birthDate, data?.expectedLifespan, data?.displayUnit],
  );

  // 데이터가 없으면 안내 표시
  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>라이프 프로그레스 데이터가 없습니다.</Text>
      </View>
    );
  }

  // ── 프리뷰 렌더 ──
  const renderPreview = () => {
    const commonProps = {
      stats,
      filledColor: data.filledColor,
      remainingColor: data.remainingColor,
    };

    switch (data.designType) {
      case 'bar':
        return <BarPreview {...commonProps} />;
      case 'dots':
        return <DotsPreview {...commonProps} />;
      case 'tree':
        return <TreePreview stats={stats} />;
      case 'book':
        return <BookPreview stats={stats} />;
      case 'moon':
        return <MoonPreview stats={stats} />;
      case 'pixel':
        return <PixelPreview {...commonProps} />;
      default:
        return <BarPreview {...commonProps} />;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ───── 1. 프리뷰 영역 ───── */}
      <View ref={captureRef} collapsable={false} style={styles.previewCard}>
        {renderPreview()}
        {/* 모토 문구 */}
        {data.motto ? (
          <Text style={styles.mottoText}>{data.motto}</Text>
        ) : null}
      </View>

      {/* ───── 2. 디자인 타입 선택 ───── */}
      <Text style={styles.sectionTitle}>디자인 타입</Text>
      <View style={styles.designGrid}>
        {DESIGN_TYPES.map((dt) => {
          const isActive = data.designType === dt.key;
          return (
            <Pressable
              key={dt.key}
              onPress={() => update({ designType: dt.key })}
              style={[
                styles.designChip,
                isActive && styles.designChipActive,
              ]}
            >
              <Text style={styles.designChipEmoji}>{dt.emoji}</Text>
              <Text
                style={[
                  styles.designChipLabel,
                  isActive && styles.designChipLabelActive,
                ]}
              >
                {dt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ───── 3. 설정 영역 ───── */}
      <Text style={styles.sectionTitle}>설정</Text>

      {/* 생년월일 */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>생년월일</Text>
        <TextInput
          style={styles.textInput}
          value={data.birthDate}
          onChangeText={(text) => {
            // YYYY-MM-DD 형식만 허용
            const cleaned = text.replace(/[^0-9-]/g, '');
            update({ birthDate: cleaned });
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>

      {/* 예상 수명 슬라이더 */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>
          예상 수명: {data.expectedLifespan}세
        </Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderEdge}>50</Text>
          <View style={styles.sliderTrack}>
            {/* 커스텀 슬라이더: 탭으로 값 변경 */}
            <Pressable
              style={styles.sliderTouchArea}
              onPress={(e) => {
                const { locationX } = e.nativeEvent;
                // 슬라이더 트랙 너비 계산 (대략적)
                const trackWidth = SCREEN_WIDTH - 120; // 패딩, 라벨 제외
                const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
                const value = Math.round(50 + ratio * 70);
                update({ expectedLifespan: value });
              }}
            >
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${((data.expectedLifespan - 50) / 70) * 100}%`,
                    backgroundColor: data.filledColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.sliderThumb,
                  {
                    left: `${((data.expectedLifespan - 50) / 70) * 100}%`,
                  },
                ]}
              />
            </Pressable>
          </View>
          <Text style={styles.sliderEdge}>120</Text>
        </View>
        {/* +/- 버튼으로 미세 조정 */}
        <View style={styles.adjustRow}>
          <Pressable
            style={styles.adjustBtn}
            onPress={() =>
              update({
                expectedLifespan: Math.max(50, data.expectedLifespan - 1),
              })
            }
          >
            <Text style={styles.adjustBtnText}>-</Text>
          </Pressable>
          <Text style={styles.adjustValue}>{data.expectedLifespan}</Text>
          <Pressable
            style={styles.adjustBtn}
            onPress={() =>
              update({
                expectedLifespan: Math.min(120, data.expectedLifespan + 1),
              })
            }
          >
            <Text style={styles.adjustBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* 표시 단위 */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>표시 단위</Text>
        <View style={styles.unitRow}>
          {DISPLAY_UNITS.map((u) => {
            const isActive = data.displayUnit === u.key;
            return (
              <Pressable
                key={u.key}
                onPress={() => update({ displayUnit: u.key })}
                style={[
                  styles.unitChip,
                  isActive && styles.unitChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.unitChipText,
                    isActive && styles.unitChipTextActive,
                  ]}
                >
                  {u.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 상세 정보 표시 토글 */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>상세 정보 표시</Text>
        <Pressable
          onPress={() => update({ showDetails: !data.showDetails })}
          style={[
            styles.toggleBtn,
            data.showDetails && styles.toggleBtnActive,
          ]}
        >
          <Text style={styles.toggleBtnText}>
            {data.showDetails ? 'ON' : 'OFF'}
          </Text>
        </Pressable>
      </View>

      {/* 모토 문구 */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>모토 문구 (선택)</Text>
        <TextInput
          style={styles.textInput}
          value={data.motto ?? ''}
          onChangeText={(text) => update({ motto: text || undefined })}
          placeholder="예: 오늘도 감사하게"
          placeholderTextColor={COLORS.textMuted}
          maxLength={40}
        />
      </View>

      {/* 색상 선택 */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>색상</Text>
        {/* 채워진 / 남은 영역 토글 */}
        <View style={styles.colorTargetRow}>
          <Pressable
            onPress={() => setColorTarget('filled')}
            style={[
              styles.colorTargetBtn,
              colorTarget === 'filled' && styles.colorTargetBtnActive,
            ]}
          >
            <View
              style={[
                styles.colorTargetSwatch,
                { backgroundColor: data.filledColor },
              ]}
            />
            <Text
              style={[
                styles.colorTargetText,
                colorTarget === 'filled' && styles.colorTargetTextActive,
              ]}
            >
              채워진 영역
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setColorTarget('remaining')}
            style={[
              styles.colorTargetBtn,
              colorTarget === 'remaining' && styles.colorTargetBtnActive,
            ]}
          >
            <View
              style={[
                styles.colorTargetSwatch,
                { backgroundColor: data.remainingColor },
              ]}
            />
            <Text
              style={[
                styles.colorTargetText,
                colorTarget === 'remaining' && styles.colorTargetTextActive,
              ]}
            >
              남은 영역
            </Text>
          </Pressable>
        </View>
        {/* 색상 팔레트 */}
        <View style={styles.paletteRow}>
          {COLOR_PALETTE.map((color) => {
            const currentColor =
              colorTarget === 'filled' ? data.filledColor : data.remainingColor;
            const isSelected = currentColor === color;
            return (
              <Pressable
                key={color}
                onPress={() =>
                  update(
                    colorTarget === 'filled'
                      ? { filledColor: color }
                      : { remainingColor: color },
                  )
                }
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  isSelected && styles.colorSwatchSelected,
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* 텍스트 색상 */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>텍스트 색상</Text>
        <View style={styles.paletteRow}>
          {['#1A1A1A', '#FFFFFF', '#FF91AD', '#91D0FF', '#FFDE59', '#6B7280'].map((color) => {
            const isSelected = (data.textColor ?? '#1A1A1A') === color;
            return (
              <Pressable
                key={color}
                onPress={() => update({ textColor: color })}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  isSelected && styles.colorSwatchSelected,
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* 하단 여백 */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ────────────────────────────────────────
// 프리뷰 스타일
// ────────────────────────────────────────
const previewStyles = StyleSheet.create({
  // 바 프리뷰
  barContainer: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  percentBig: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 36,
    color: COLORS.textPrimary,
  },
  barTrack: {
    width: '100%',
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  statsText: {
    fontFamily: 'Gaegu',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // 점 프리뷰
  dotsContainer: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  dotsGrid: {
    gap: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotsCaption: {
    fontFamily: 'Gaegu',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // 나무 프리뷰
  treeContainer: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  treeEmoji: {
    fontSize: 56,
  },
  treeLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  percentMedium: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 28,
    color: COLORS.textPrimary,
  },
  // 책 프리뷰
  bookContainer: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  bookEmoji: {
    fontSize: 48,
  },
  bookChapter: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  // 달 프리뷰
  moonContainer: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  moonEmoji: {
    fontSize: 56,
  },
  // 픽셀 프리뷰
  pixelContainer: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  pixelGrid: {
    gap: 2,
  },
  pixelRow: {
    flexDirection: 'row',
    gap: 2,
  },
  pixelCell: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
  },
});

// ────────────────────────────────────────
// 메인 스타일
// ────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontFamily: 'Gaegu',
    fontSize: 18,
    color: COLORS.textMuted,
  },

  // ── 프리뷰 카드 ──
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: COLORS.border,
    // 삐뚤빼뚤 Neubrutalism 라운딩
    borderTopLeftRadius: 18,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 10,
    padding: 24,
    alignItems: 'center',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 24,
  },
  mottoText: {
    fontFamily: 'Gaegu',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── 섹션 타이틀 ──
  sectionTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },

  // ── 디자인 타입 그리드 ──
  designGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  designChip: {
    width: (SCREEN_WIDTH - 40 - 20) / 3, // 3열
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: COLORS.border,
    // 삐뚤빼뚤
    borderTopLeftRadius: 12,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 5,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  designChipActive: {
    backgroundColor: COLORS.accent,
    // 눌림 피드백
    shadowOffset: { width: 1, height: 1 },
    transform: [{ translateY: 1 }],
  },
  designChipEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  designChipLabel: {
    fontFamily: 'Gaegu',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  designChipLabelActive: {
    fontFamily: 'Gaegu-Bold',
    color: COLORS.textPrimary,
  },

  // ── 설정 행 ──
  settingRow: {
    marginBottom: 20,
  },
  settingLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  // ── 텍스트 입력 ──
  textInput: {
    fontFamily: 'Gaegu',
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.accent,
  },
  toggleBtnText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontFamily: 'Gaegu',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dateConfirmBtn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  dateConfirmText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  // ── 슬라이더 ──
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderEdge: {
    fontFamily: 'Gaegu',
    fontSize: 13,
    color: COLORS.textMuted,
    width: 28,
    textAlign: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  sliderTouchArea: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 10,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: COLORS.border,
    marginLeft: -10,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  adjustBtn: {
    width: 36,
    height: 36,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  adjustBtnText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  adjustValue: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },

  // ── 표시 단위 ──
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 4,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  unitChipActive: {
    backgroundColor: COLORS.accent,
    shadowOffset: { width: 1, height: 1 },
    transform: [{ translateY: 1 }],
  },
  unitChipText: {
    fontFamily: 'Gaegu',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  unitChipTextActive: {
    fontFamily: 'Gaegu-Bold',
    color: COLORS.textPrimary,
  },

  // ── 색상 선택 ──
  colorTargetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  colorTargetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 4,
  },
  colorTargetBtnActive: {
    backgroundColor: '#F3F4F6',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  colorTargetSwatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  colorTargetText: {
    fontFamily: 'Gaegu',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  colorTargetTextActive: {
    fontFamily: 'Gaegu-Bold',
    color: COLORS.textPrimary,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  colorSwatchSelected: {
    borderWidth: 4,
    // 눌림 피드백
    shadowOffset: { width: 1, height: 1 },
    transform: [{ translateY: 1 }],
  },
});
