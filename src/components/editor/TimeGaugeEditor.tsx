import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Rect, Path, Defs, ClipPath, G } from 'react-native-svg';
import { useProjectStore, GaugeStyle } from '@/stores/useProjectStore';
import { COLORS } from '@/constants';

// ────────────────────────────────────────
// 상수
// ────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH - 64;
const PREVIEW_HEIGHT = 160;

// 게이지 색상 팔레트
const GAUGE_COLORS = [
  '#FFDE59', '#91D0FF', '#FF91AD', '#F0FFF4',
  '#FFD6E0', '#C1F0C1', '#E6F3FF', '#FFF0F5',
];

// 캐릭터 이모지 옵션
const CHARACTER_EMOJIS = ['🏃', '🚀', '⚡', '🔥', '💧', '☀️', '🌙', '⭐'];

// 게이지 스타일 목록
const GAUGE_STYLES: { key: GaugeStyle; label: string; emoji: string }[] = [
  { key: 'horizontal', label: '가로바', emoji: '➡️' },
  { key: 'vertical', label: '세로바', emoji: '⬆️' },
  { key: 'circular', label: '원형', emoji: '⭕' },
  { key: 'water', label: '물채움', emoji: '💧' },
  { key: 'battery', label: '배터리', emoji: '🔋' },
];

// 표시 형식 옵션
const DISPLAY_FORMATS: { key: 'percent' | 'remaining' | 'elapsed'; label: string }[] = [
  { key: 'percent', label: '퍼센트' },
  { key: 'remaining', label: '남은 시간' },
  { key: 'elapsed', label: '경과 시간' },
];

// ────────────────────────────────────────
// 유틸리티
// ────────────────────────────────────────

/** 시간 문자열 "HH:MM"을 분 단위로 변환 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 분을 "HH시간 MM분" 형식으로 */
function minutesToLabel(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = Math.round(totalMins % 60);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 현재 시각 기준 진행률 계산 (0~1) */
function calcProgress(startTime: string, endTime: string): number {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const total = end - start;
  if (total <= 0) return 0;
  const elapsed = nowMins - start;
  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 1;
  return elapsed / total;
}

/** 진행률을 표시 형식에 맞게 텍스트로 */
function formatProgress(
  progress: number,
  displayFormat: 'percent' | 'remaining' | 'elapsed',
  startTime: string,
  endTime: string,
): string {
  const total = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (total <= 0) return '0%';

  switch (displayFormat) {
    case 'percent':
      return `${Math.round(progress * 100)}%`;
    case 'elapsed':
      return minutesToLabel(Math.round(progress * total));
    case 'remaining':
      return minutesToLabel(Math.round((1 - progress) * total));
  }
}

// ────────────────────────────────────────
// 서브 컴포넌트: 가로 프로그레스 바
// ────────────────────────────────────────

function HorizontalGauge({
  progress,
  fillColor,
  character,
  text,
}: {
  progress: number;
  fillColor: string;
  character?: string;
  text: string;
}) {
  const barWidth = PREVIEW_WIDTH - 40;
  const fillWidth = barWidth * progress;

  return (
    <View style={gaugeStyles.horizontalContainer}>
      <Text style={gaugeStyles.gaugeText}>{text}</Text>
      <View style={gaugeStyles.horizontalTrack}>
        <View
          style={[
            gaugeStyles.horizontalFill,
            { width: fillWidth, backgroundColor: fillColor },
          ]}
        />
        {/* 캐릭터 이모지 */}
        {character && (
          <Text
            style={[
              gaugeStyles.characterOnBar,
              { left: Math.max(0, fillWidth - 16) },
            ]}
          >
            {character}
          </Text>
        )}
      </View>
    </View>
  );
}

// ────────────────────────────────────────
// 서브 컴포넌트: 세로 프로그레스 바
// ────────────────────────────────────────

function VerticalGauge({
  progress,
  fillColor,
  character,
  text,
}: {
  progress: number;
  fillColor: string;
  character?: string;
  text: string;
}) {
  const barHeight = PREVIEW_HEIGHT - 50;
  const fillHeight = barHeight * progress;

  return (
    <View style={gaugeStyles.verticalContainer}>
      <View style={gaugeStyles.verticalTrack}>
        <View
          style={[
            gaugeStyles.verticalFill,
            { height: fillHeight, backgroundColor: fillColor },
          ]}
        />
        {/* 캐릭터 이모지: 채워진 영역 상단에 표시 */}
        {character && (
          <Text
            style={[
              gaugeStyles.characterOnVertical,
              { bottom: fillHeight - 4 },
            ]}
          >
            {character}
          </Text>
        )}
      </View>
      <Text style={gaugeStyles.gaugeText}>{text}</Text>
    </View>
  );
}

// ────────────────────────────────────────
// 서브 컴포넌트: 원형 게이지 (SVG)
// ────────────────────────────────────────

function CircularGauge({
  progress,
  fillColor,
  character,
  text,
}: {
  progress: number;
  fillColor: string;
  character?: string;
  text: string;
}) {
  const size = PREVIEW_HEIGHT - 30;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={gaugeStyles.circularContainer}>
      <Svg width={size} height={size}>
        {/* 배경 원 */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={COLORS.editorBg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 채워진 원 */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      {/* 중앙 텍스트 */}
      <View style={gaugeStyles.circularCenter}>
        {character && <Text style={gaugeStyles.circularEmoji}>{character}</Text>}
        <Text style={gaugeStyles.circularText}>{text}</Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────
// 서브 컴포넌트: 물 채움 게이지
// ────────────────────────────────────────

function WaterGauge({
  progress,
  fillColor,
  character,
  text,
}: {
  progress: number;
  fillColor: string;
  character?: string;
  text: string;
}) {
  const size = PREVIEW_HEIGHT - 30;
  const radius = size / 2;
  const waterLevel = size * (1 - progress);

  // 웨이브 경로 생성
  const waveHeight = 6;
  const waveY = waterLevel;
  const wavePath = `
    M 0 ${waveY}
    Q ${size * 0.25} ${waveY - waveHeight}, ${size * 0.5} ${waveY}
    Q ${size * 0.75} ${waveY + waveHeight}, ${size} ${waveY}
    L ${size} ${size}
    L 0 ${size}
    Z
  `;

  return (
    <View style={gaugeStyles.circularContainer}>
      <Svg width={size} height={size}>
        {/* 원형 클리핑 */}
        <Defs>
          <ClipPath id="circleClip">
            <Circle cx={radius} cy={radius} r={radius - 3} />
          </ClipPath>
        </Defs>
        {/* 배경 원 */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - 3}
          stroke={COLORS.border}
          strokeWidth={3}
          fill={COLORS.background}
        />
        {/* 물 채우기 (웨이브) */}
        <G clipPath="url(#circleClip)">
          <Path d={wavePath} fill={fillColor} opacity={0.7} />
        </G>
        {/* 테두리 */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - 3}
          stroke={COLORS.border}
          strokeWidth={3}
          fill="none"
        />
      </Svg>
      {/* 중앙 텍스트 */}
      <View style={gaugeStyles.circularCenter}>
        {character && <Text style={gaugeStyles.circularEmoji}>{character}</Text>}
        <Text style={gaugeStyles.circularText}>{text}</Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────
// 서브 컴포넌트: 배터리 게이지
// ────────────────────────────────────────

function BatteryGauge({
  progress,
  fillColor,
  character,
  text,
}: {
  progress: number;
  fillColor: string;
  character?: string;
  text: string;
}) {
  const batteryWidth = PREVIEW_WIDTH - 80;
  const batteryHeight = 64;
  const capWidth = 10;
  const padding = 6;
  const innerWidth = (batteryWidth - padding * 2) * progress;

  return (
    <View style={gaugeStyles.batteryContainer}>
      <View style={gaugeStyles.batteryBody}>
        {/* 배터리 내부 채움 */}
        <View
          style={[
            gaugeStyles.batteryFill,
            {
              width: innerWidth,
              backgroundColor: fillColor,
            },
          ]}
        />
        {/* 캐릭터 */}
        {character && (
          <Text
            style={[
              gaugeStyles.characterOnBar,
              { left: Math.max(4, innerWidth - 16) },
            ]}
          >
            {character}
          </Text>
        )}
      </View>
      {/* 배터리 돌기 */}
      <View style={gaugeStyles.batteryCap} />
      <Text style={[gaugeStyles.gaugeText, { marginLeft: 12 }]}>{text}</Text>
    </View>
  );
}

// ────────────────────────────────────────
// 게이지 프리뷰 렌더러
// ────────────────────────────────────────

function GaugePreview({
  progress,
  fillColor,
  gaugeStyle,
  character,
  text,
  label,
}: {
  progress: number;
  fillColor: string;
  gaugeStyle: GaugeStyle;
  character?: string;
  text: string;
  label: string;
}) {
  const GaugeComponent = {
    horizontal: HorizontalGauge,
    vertical: VerticalGauge,
    circular: CircularGauge,
    water: WaterGauge,
    battery: BatteryGauge,
  }[gaugeStyle];

  return (
    <View style={gaugeStyles.previewCard}>
      {/* 라벨 */}
      <Text style={gaugeStyles.previewLabel}>{label}</Text>
      <GaugeComponent
        progress={progress}
        fillColor={fillColor}
        character={character}
        text={text}
      />
    </View>
  );
}

// ────────────────────────────────────────
// 시간 선택 행 (간단한 +/- 버튼)
// ────────────────────────────────────────

function TimeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const mins = timeToMinutes(value);

  const adjust = (delta: number) => {
    let next = mins + delta;
    // 00:00~24:00 범위 제한
    if (next < 0) next = 0;
    if (next > 1440) next = 1440;
    const h = Math.floor(next / 60);
    const m = next % 60;
    onChange(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  return (
    <View style={optionStyles.timeRow}>
      <Text style={optionStyles.timeLabel}>{label}</Text>
      <View style={optionStyles.timeControls}>
        <Pressable onPress={() => adjust(-30)} style={optionStyles.timeBtn}>
          <Text style={optionStyles.timeBtnText}>-</Text>
        </Pressable>
        <Text style={optionStyles.timeValue}>{value}</Text>
        <Pressable onPress={() => adjust(30)} style={optionStyles.timeBtn}>
          <Text style={optionStyles.timeBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ────────────────────────────────────────
// 메인 컴포넌트
// ────────────────────────────────────────

export default function TimeGaugeEditor({ captureRef }: { captureRef?: React.RefObject<View | null> }) {
  const project = useProjectStore((s) => s.currentProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);

  // 타임게이지 데이터 (없으면 기본값)
  const data = project?.timeGaugeData ?? {
    gaugeStyle: 'horizontal' as GaugeStyle,
    startTime: '00:00',
    endTime: '24:00',
    displayFormat: 'percent' as const,
    label: '오늘 하루',
    fillColor: '#FFDE59',
    character: undefined,
  };

  // 현재 시각 기반 진행률 (매 분마다 갱신)
  const [progress, setProgress] = useState(() =>
    calcProgress(data.startTime, data.endTime),
  );

  useEffect(() => {
    // 초기 계산
    setProgress(calcProgress(data.startTime, data.endTime));
    // 1분마다 갱신
    const timer = setInterval(() => {
      setProgress(calcProgress(data.startTime, data.endTime));
    }, 60_000);
    return () => clearInterval(timer);
  }, [data.startTime, data.endTime]);

  // 표시 텍스트 계산
  const displayText = useMemo(
    () => formatProgress(progress, data.displayFormat, data.startTime, data.endTime),
    [progress, data.displayFormat, data.startTime, data.endTime],
  );

  // 데이터 업데이트 헬퍼
  const update = (partial: Partial<typeof data>) => {
    updateCurrentProject({
      timeGaugeData: { ...data, ...partial },
    });
  };

  return (
    <ScrollView
      style={mainStyles.container}
      contentContainerStyle={mainStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 게이지 프리뷰 ── */}
      <View ref={captureRef} collapsable={false}>
      <GaugePreview
        progress={progress}
        fillColor={data.fillColor}
        gaugeStyle={data.gaugeStyle}
        character={data.character}
        text={displayText}
        label={data.label}
      />
      </View>

      {/* ── 게이지 스타일 선택 ── */}
      <Text style={mainStyles.sectionTitle}>게이지 스타일</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={mainStyles.horizontalList}
      >
        {GAUGE_STYLES.map((gs) => {
          const isActive = data.gaugeStyle === gs.key;
          return (
            <Pressable
              key={gs.key}
              onPress={() => update({ gaugeStyle: gs.key })}
              style={[
                mainStyles.styleChip,
                isActive && mainStyles.styleChipActive,
              ]}
            >
              <Text style={mainStyles.styleChipEmoji}>{gs.emoji}</Text>
              <Text
                style={[
                  mainStyles.styleChipLabel,
                  isActive && mainStyles.styleChipLabelActive,
                ]}
              >
                {gs.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── 시간 설정 ── */}
      <Text style={mainStyles.sectionTitle}>시간 범위</Text>
      <View style={mainStyles.optionCard}>
        <TimeRow
          label="시작"
          value={data.startTime}
          onChange={(v) => update({ startTime: v })}
        />
        <View style={mainStyles.divider} />
        <TimeRow
          label="끝"
          value={data.endTime}
          onChange={(v) => update({ endTime: v })}
        />
      </View>

      {/* ── 표시 형식 ── */}
      <Text style={mainStyles.sectionTitle}>표시 형식</Text>
      <View style={mainStyles.chipRow}>
        {DISPLAY_FORMATS.map((df) => {
          const isActive = data.displayFormat === df.key;
          return (
            <Pressable
              key={df.key}
              onPress={() => update({ displayFormat: df.key })}
              style={[
                mainStyles.formatChip,
                isActive && mainStyles.formatChipActive,
              ]}
            >
              <Text
                style={[
                  mainStyles.formatChipText,
                  isActive && mainStyles.formatChipTextActive,
                ]}
              >
                {df.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── 라벨 텍스트 ── */}
      <Text style={mainStyles.sectionTitle}>라벨</Text>
      <View style={mainStyles.optionCard}>
        <TextInput
          style={mainStyles.textInput}
          value={data.label}
          onChangeText={(v) => update({ label: v })}
          placeholder="예: 오늘 하루"
          placeholderTextColor={COLORS.textMuted}
          maxLength={20}
        />
      </View>

      {/* ── 게이지 색상 ── */}
      <Text style={mainStyles.sectionTitle}>게이지 색상</Text>
      <View style={mainStyles.chipRow}>
        {GAUGE_COLORS.map((color) => {
          const isActive = data.fillColor === color;
          return (
            <Pressable
              key={color}
              onPress={() => update({ fillColor: color })}
              style={[
                mainStyles.colorChip,
                { backgroundColor: color },
                isActive && mainStyles.colorChipActive,
              ]}
            >
              {isActive && <Text style={mainStyles.colorCheck}>✓</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* ── 배경색 ── */}
      <Text style={mainStyles.sectionTitle}>배경색</Text>
      <View style={mainStyles.chipRow}>
        {GAUGE_COLORS.map((color) => {
          const isActive = (data.bgColor ?? '#FFFFFF') === color;
          return (
            <Pressable
              key={color}
              onPress={() => update({ bgColor: color })}
              style={[
                mainStyles.colorChip,
                { backgroundColor: color },
                isActive && mainStyles.colorChipActive,
              ]}
            >
              {isActive && <Text style={mainStyles.colorCheck}>✓</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* ── 텍스트색 ── */}
      <Text style={mainStyles.sectionTitle}>텍스트색</Text>
      <View style={mainStyles.chipRow}>
        {['#1A1A1A', '#FFFFFF', '#FF91AD', '#91D0FF', '#FFDE59', '#6B7280'].map((color) => {
          const isActive = (data.textColor ?? '#1A1A1A') === color;
          return (
            <Pressable
              key={color}
              onPress={() => update({ textColor: color })}
              style={[
                mainStyles.colorChip,
                { backgroundColor: color },
                isActive && mainStyles.colorChipActive,
              ]}
            >
              {isActive && <Text style={[mainStyles.colorCheck, { color: color === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A' }]}>✓</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* ── 캐릭터 이모지 ── */}
      <Text style={mainStyles.sectionTitle}>캐릭터</Text>
      <View style={mainStyles.chipRow}>
        {/* 없음 옵션 */}
        <Pressable
          onPress={() => update({ character: undefined })}
          style={[
            mainStyles.emojiChip,
            !data.character && mainStyles.emojiChipActive,
          ]}
        >
          <Text style={mainStyles.emojiChipText}>없음</Text>
        </Pressable>
        {CHARACTER_EMOJIS.map((emoji) => {
          const isActive = data.character === emoji;
          return (
            <Pressable
              key={emoji}
              onPress={() => update({ character: emoji })}
              style={[
                mainStyles.emojiChip,
                isActive && mainStyles.emojiChipActive,
              ]}
            >
              <Text style={mainStyles.emojiChipEmoji}>{emoji}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 하단 여백 */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ────────────────────────────────────────
// 스타일: 게이지 프리뷰 서브컴포넌트
// ────────────────────────────────────────

const gaugeStyles = StyleSheet.create({
  // 프리뷰 카드
  previewCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: PREVIEW_HEIGHT,
    // 뉴브루탈리즘 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  previewLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  gaugeText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 8,
  },

  // ── 가로 게이지 ──
  horizontalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  horizontalTrack: {
    width: PREVIEW_WIDTH - 40,
    height: 32,
    backgroundColor: COLORS.editorBg,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  horizontalFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 3,
  },
  characterOnBar: {
    position: 'absolute',
    top: -2,
    fontSize: 20,
  },

  // ── 세로 게이지 ──
  verticalContainer: {
    alignItems: 'center',
  },
  verticalTrack: {
    width: 40,
    height: PREVIEW_HEIGHT - 50,
    backgroundColor: COLORS.editorBg,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalFill: {
    width: '100%',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 7,
  },
  characterOnVertical: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 20,
  },

  // ── 원형 & 물채움 공통 ──
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  circularText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },

  // ── 배터리 ──
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryBody: {
    width: PREVIEW_WIDTH - 80,
    height: 64,
    backgroundColor: COLORS.editorBg,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 8,
    overflow: 'hidden',
    padding: 6,
    justifyContent: 'center',
  },
  batteryFill: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  batteryCap: {
    width: 10,
    height: 24,
    backgroundColor: COLORS.border,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});

// ────────────────────────────────────────
// 스타일: 시간 설정 행
// ────────────────────────────────────────

const optionStyles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timeLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeBtn: {
    width: 36,
    height: 36,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.editorBg,
    alignItems: 'center',
    justifyContent: 'center',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  timeBtnText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  timeValue: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
    minWidth: 60,
    textAlign: 'center',
  },
});

// ────────────────────────────────────────
// 스타일: 메인 레이아웃 & 옵션
// ────────────────────────────────────────

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // 섹션 타이틀
  sectionTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },

  // 가로 스크롤 리스트
  horizontalList: {
    gap: 10,
    paddingRight: 12,
  },

  // 게이지 스타일 칩
  styleChip: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    gap: 4,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  styleChipActive: {
    backgroundColor: COLORS.accent,
  },
  styleChipEmoji: {
    fontSize: 22,
  },
  styleChipLabel: {
    fontFamily: 'Gaegu',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  styleChipLabelActive: {
    fontFamily: 'Gaegu-Bold',
    color: COLORS.textPrimary,
  },

  // 옵션 카드 (시간 설정, 라벨 등)
  optionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 8,
    padding: 16,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.editorBg,
    marginVertical: 8,
  },

  // 칩 행 (여러 개의 칩을 wrap으로 배치)
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // 표시 형식 칩
  formatChip: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: COLORS.surface,
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  formatChipActive: {
    backgroundColor: COLORS.accent,
  },
  formatChipText: {
    fontFamily: 'Gaegu',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  formatChipTextActive: {
    fontFamily: 'Gaegu-Bold',
    color: COLORS.textPrimary,
  },

  // 텍스트 입력
  textInput: {
    fontFamily: 'Gaegu',
    fontSize: 18,
    color: COLORS.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  // 색상 칩
  colorChip: {
    width: 42,
    height: 42,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // 하드 섀도우
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  colorChipActive: {
    borderWidth: 3.5,
    shadowOffset: { width: 3, height: 3 },
  },
  colorCheck: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },

  // 이모지 칩
  emojiChip: {
    width: 48,
    height: 48,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 6,
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
  emojiChipActive: {
    backgroundColor: COLORS.accent,
  },
  emojiChipText: {
    fontFamily: 'Gaegu',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emojiChipEmoji: {
    fontSize: 22,
  },
});
