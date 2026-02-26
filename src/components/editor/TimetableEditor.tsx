import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '@/constants';
import {
  useProjectStore,
  ScheduleItem,
  DayOfWeek,
  TimetableViewType,
  TimetableLayoutMode,
  DAYS,
} from '@/stores/useProjectStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 일정 색상 팔레트
const SCHEDULE_COLORS = [
  '#91D0FF', '#FF91AD', '#FFDE59', '#F0FFF4',
  '#E6F3FF', '#FFF0F5', '#FFD6E0', '#C1F0C1',
];

// 타임라인 시간대 (6시~23시)
const TIMELINE_START = 6;
const TIMELINE_END = 23;
const HOUR_HEIGHT = 52; // 1시간당 높이(px)

// 시간 문자열 → 분
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// 분 → "HH:MM"
function formatTime(t: string): string {
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

// 원형 시계용 각도 계산
function minutesToAngle(minutes: number, mode: '12h' | '24h' = '12h'): number {
  if (mode === '24h') {
    const normalised = minutes % 1440;
    return (normalised / 1440) * 360 - 90;
  }
  const normalised = minutes % 720;
  return (normalised / 720) * 360 - 90;
}
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = { x: cx + r * Math.cos(degToRad(endAngle)), y: cy + r * Math.sin(degToRad(endAngle)) };
  const end = { x: cx + r * Math.cos(degToRad(startAngle)), y: cy + r * Math.sin(degToRad(startAngle)) };
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

// 시간 겹침 체크 — 겹치는 일정 목록 반환
function findOverlaps(
  schedules: ScheduleItem[],
  startTime: string,
  endTime: string,
  excludeId?: string,
): ScheduleItem[] {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);
  return schedules.filter((item) => {
    if (item.id === excludeId) return false;
    const s = timeToMinutes(item.startTime);
    const e = timeToMinutes(item.endTime);
    return newStart < e && newEnd > s; // 겹침 조건
  });
}

// ===================================================================
// 메인 컴포넌트
// ===================================================================
export default function TimetableEditor({ captureRef }: { captureRef?: React.RefObject<View | null> }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setSelectedDay = useProjectStore((s) => s.setSelectedDay);
  const setTimetableViewType = useProjectStore((s) => s.setTimetableViewType);
  const addScheduleItem = useProjectStore((s) => s.addScheduleItem);
  const removeScheduleItem = useProjectStore((s) => s.removeScheduleItem);
  const updateScheduleItem = useProjectStore((s) => s.updateScheduleItem);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);

  const timetable = currentProject?.timetableData;
  const selectedDay: DayOfWeek = timetable?.selectedDay ?? 'mon';
  const viewType: TimetableViewType = timetable?.viewType ?? 'block';
  const layoutMode: TimetableLayoutMode = timetable?.layoutMode ?? 'daily';
  const showWeekend = timetable?.showWeekend ?? true;

  // 표시할 요일 목록 (주말 토글)
  const visibleDays = useMemo(
    () => showWeekend ? DAYS : DAYS.filter((d) => d.key !== 'sat' && d.key !== 'sun'),
    [showWeekend],
  );

  // 현재 선택 요일의 일정
  const schedules: ScheduleItem[] = timetable?.days[selectedDay] ?? [];

  // 추가 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartH, setNewStartH] = useState('09');
  const [newStartM, setNewStartM] = useState('00');
  const [newEndH, setNewEndH] = useState('10');
  const [newEndM, setNewEndM] = useState('00');
  const [newColor, setNewColor] = useState(SCHEDULE_COLORS[0]);

  // 모든 요일 적용 토글
  const [applyAllDays, setApplyAllDays] = useState(false);

  // 편집 모달 상태
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartH, setEditStartH] = useState('');
  const [editStartM, setEditStartM] = useState('');
  const [editEndH, setEditEndH] = useState('');
  const [editEndM, setEditEndM] = useState('');
  const [editColor, setEditColor] = useState('');

  // 레이아웃/뷰 변경 핸들러
  const setLayoutMode = useCallback((mode: TimetableLayoutMode) => {
    if (!currentProject?.timetableData) return;
    updateCurrentProject({
      timetableData: { ...currentProject.timetableData, layoutMode: mode },
    });
  }, [currentProject, updateCurrentProject]);

  const clockMode = timetable?.clockMode ?? '12h';
  const toggleClockMode = useCallback(() => {
    if (!currentProject?.timetableData) return;
    const newMode = currentProject.timetableData.clockMode === '12h' ? '24h' : '12h';
    updateCurrentProject({
      timetableData: { ...currentProject.timetableData, clockMode: newMode },
    });
  }, [currentProject, updateCurrentProject]);

  const toggleWeekend = useCallback(() => {
    if (!currentProject?.timetableData) return;
    updateCurrentProject({
      timetableData: { ...currentProject.timetableData, showWeekend: !showWeekend },
    });
  }, [currentProject, updateCurrentProject, showWeekend]);

  // 일정 추가 (겹침 경고 포함)
  const handleAddSchedule = useCallback(() => {
    if (!newTitle.trim()) return;
    const startTime = `${newStartH.padStart(2, '0')}:${newStartM.padStart(2, '0')}`;
    const endTime = `${newEndH.padStart(2, '0')}:${newEndM.padStart(2, '0')}`;
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return;

    const overlaps = findOverlaps(schedules, startTime, endTime);
    const doAdd = () => {
      if (applyAllDays) {
        // 모든 요일에 추가
        const dayKeys: DayOfWeek[] = showWeekend
          ? DAYS.map((d) => d.key)
          : DAYS.filter((d) => d.key !== 'sat' && d.key !== 'sun').map((d) => d.key);
        dayKeys.forEach((dayKey) => {
          const item: ScheduleItem = {
            id: `${Date.now()}-${dayKey}`,
            startTime,
            endTime,
            title: newTitle.trim(),
            color: newColor,
          };
          addScheduleItem(dayKey, item);
        });
      } else {
        const item: ScheduleItem = {
          id: Date.now().toString(),
          startTime,
          endTime,
          title: newTitle.trim(),
          color: newColor,
        };
        addScheduleItem(selectedDay, item);
      }
      setNewTitle('');
      setNewStartH('09');
      setNewStartM('00');
      setNewEndH('10');
      setNewEndM('00');
      setNewColor(SCHEDULE_COLORS[0]);
      setModalVisible(false);
    };

    if (overlaps.length > 0) {
      const names = overlaps.map((o) => `"${o.title}"`).join(', ');
      Alert.alert(
        '시간 겹침',
        `${names}과(와) 시간이 겹칩니다.\n그래도 추가하시겠어요?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '추가', onPress: doAdd },
        ],
      );
    } else {
      doAdd();
    }
  }, [newTitle, newStartH, newStartM, newEndH, newEndM, newColor, selectedDay, schedules, addScheduleItem, applyAllDays, showWeekend]);

  // 블록 탭 → 편집 모달 열기
  const handleEditBlock = useCallback((item: ScheduleItem) => {
    setEditItem(item);
    setEditTitle(item.title);
    const [sh, sm] = item.startTime.split(':');
    const [eh, em] = item.endTime.split(':');
    setEditStartH(sh);
    setEditStartM(sm);
    setEditEndH(eh);
    setEditEndM(em);
    setEditColor(item.color);
  }, []);

  // 편집 저장 (겹침 경고 포함)
  const handleSaveEdit = useCallback(() => {
    if (!editItem || !editTitle.trim()) return;
    const startTime = `${editStartH.padStart(2, '0')}:${editStartM.padStart(2, '0')}`;
    const endTime = `${editEndH.padStart(2, '0')}:${editEndM.padStart(2, '0')}`;
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return;

    const overlaps = findOverlaps(schedules, startTime, endTime, editItem.id);
    const doSave = () => {
      updateScheduleItem(selectedDay, editItem.id, {
        title: editTitle.trim(),
        startTime,
        endTime,
        color: editColor,
      });
      setEditItem(null);
    };

    if (overlaps.length > 0) {
      const names = overlaps.map((o) => `"${o.title}"`).join(', ');
      Alert.alert(
        '시간 겹침',
        `${names}과(와) 시간이 겹칩니다.\n그래도 저장하시겠어요?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '저장', onPress: doSave },
        ],
      );
    } else {
      doSave();
    }
  }, [editItem, editTitle, editStartH, editStartM, editEndH, editEndM, editColor, selectedDay, schedules, updateScheduleItem]);

  if (!timetable) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>타임테이블 데이터가 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 상단 컨트롤 바 ── */}
      <View style={styles.controlBar}>
        {/* 왼쪽: 뷰 타입 토글 (블록/원형) */}
        <View style={styles.toggleGroup}>
          <ToggleChip
            label="블록"
            active={viewType === 'block'}
            onPress={() => setTimetableViewType('block')}
          />
          <ToggleChip
            label="원형"
            active={viewType === 'circle'}
            onPress={() => setTimetableViewType('circle')}
          />
        </View>
        {/* 오른쪽: 레이아웃 토글 (데일리/위클리) */}
        <View style={styles.toggleGroup}>
          <ToggleChip
            label="데일리"
            active={layoutMode === 'daily'}
            onPress={() => setLayoutMode('daily')}
          />
          <ToggleChip
            label="위클리"
            active={layoutMode === 'weekly'}
            onPress={() => setLayoutMode('weekly')}
          />
        </View>
      </View>

      {/* ── 주말 토글 + 요일 탭 (데일리일 때만) ── */}
      <View style={styles.dayRow}>
        {layoutMode === 'daily' ? (
          /* 데일리: 컴팩트 요일 탭 */
          <View style={styles.dayTabs}>
            {visibleDays.map((day) => {
              const isSelected = day.key === selectedDay;
              return (
                <TouchableOpacity
                  key={day.key}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDay(day.key)}
                  style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                >
                  <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* 위클리: 요일 탭 대신 라벨만 */
          <Text style={styles.weeklyLabel}>주간 시간표</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {/* 원형 뷰일 때 12h/24h 토글 */}
          {viewType === 'circle' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleClockMode}
              style={[styles.weekendToggle, styles.weekendToggleActive]}
            >
              <Text style={styles.weekendToggleText}>
                {clockMode}
              </Text>
            </TouchableOpacity>
          )}
          {/* 주말 토글 */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleWeekend}
            style={[styles.weekendToggle, showWeekend && styles.weekendToggleActive]}
          >
            <Text style={styles.weekendToggleText}>
              주말 {showWeekend ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 메인 콘텐츠 ── */}
      <ScrollView ref={captureRef as any} style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {viewType === 'block' && layoutMode === 'daily' && (
          <DailyBlockView
            schedules={schedules}
            onRemove={(id) => removeScheduleItem(selectedDay, id)}
            onEdit={handleEditBlock}
          />
        )}
        {viewType === 'block' && layoutMode === 'weekly' && (
          <WeeklyBlockView
            days={timetable.days}
            visibleDays={visibleDays}
          />
        )}
        {viewType === 'circle' && layoutMode === 'daily' && (
          <DailyCircleView
            schedules={schedules}
            dayLabel={DAYS.find((d) => d.key === selectedDay)?.label ?? ''}
            clockMode={clockMode}
          />
        )}
        {viewType === 'circle' && layoutMode === 'weekly' && (
          <WeeklyCircleView
            days={timetable.days}
            visibleDays={visibleDays}
          />
        )}
      </ScrollView>

      {/* ── 하단 일정 추가 ── */}
      <View style={styles.addArea}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ 일정 추가</Text>
        </TouchableOpacity>
      </View>

      {/* ── 일정 추가 모달 ── */}
      <AddScheduleModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddSchedule}
        title={newTitle}
        onTitleChange={setNewTitle}
        startH={newStartH}
        startM={newStartM}
        endH={newEndH}
        endM={newEndM}
        onStartHChange={setNewStartH}
        onStartMChange={setNewStartM}
        onEndHChange={setNewEndH}
        onEndMChange={setNewEndM}
        color={newColor}
        onColorChange={setNewColor}
        applyAllDays={applyAllDays}
        onApplyAllDaysChange={setApplyAllDays}
      />

      {/* ── 일정 편집 모달 ── */}
      <AddScheduleModal
        visible={editItem !== null}
        onClose={() => setEditItem(null)}
        onAdd={handleSaveEdit}
        title={editTitle}
        onTitleChange={setEditTitle}
        startH={editStartH}
        startM={editStartM}
        endH={editEndH}
        endM={editEndM}
        onStartHChange={setEditStartH}
        onStartMChange={setEditStartM}
        onEndHChange={setEditEndH}
        onEndMChange={setEditEndM}
        color={editColor}
        onColorChange={setEditColor}
        isEdit
      />
    </View>
  );
}

// ===================================================================
// 토글 칩 (블록/원형, 데일리/위클리)
// ===================================================================
function ToggleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.toggleChip, active && styles.toggleChipActive]}
    >
      <Text style={[styles.toggleChipText, active && styles.toggleChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ===================================================================
// 데일리 + 블록형 (타임라인 사이드바)
// ===================================================================
function DailyBlockView({ schedules, onRemove, onEdit }: { schedules: ScheduleItem[]; onRemove: (id: string) => void; onEdit: (item: ScheduleItem) => void }) {
  const totalHours = TIMELINE_END - TIMELINE_START;
  const timelineHeight = totalHours * HOUR_HEIGHT;

  if (schedules.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>📝</Text>
        <Text style={styles.emptyStateText}>아직 일정이 없어요</Text>
        <Text style={styles.emptyStateSubText}>아래 버튼을 눌러 일정을 추가해보세요!</Text>
      </View>
    );
  }

  return (
    <View style={styles.timelineContainer}>
      {/* 시간 눈금 (왼쪽) + 블록 (오른쪽) */}
      <View style={[styles.timelineInner, { height: timelineHeight }]}>
        {/* 시간 라벨 + 가로줄 */}
        {Array.from({ length: totalHours + 1 }).map((_, i) => {
          const hour = TIMELINE_START + i;
          return (
            <View key={hour} style={[styles.timelineRow, { top: i * HOUR_HEIGHT }]}>
              <Text style={styles.timelineLabel}>
                {hour.toString().padStart(2, '0')}
              </Text>
              <View style={styles.timelineLine} />
            </View>
          );
        })}

        {/* 일정 블록들 — 시간대에 맞게 절대 위치 */}
        {schedules.map((item) => {
          const startMin = timeToMinutes(item.startTime);
          const endMin = timeToMinutes(item.endTime);
          const top = ((startMin - TIMELINE_START * 60) / 60) * HOUR_HEIGHT;
          const height = ((endMin - startMin) / 60) * HOUR_HEIGHT - 2;
          if (top < 0 || height <= 0) return null;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => onEdit(item)}
              onLongPress={() => onRemove(item.id)}
              style={[
                styles.timelineBlock,
                {
                  top,
                  height: Math.max(height, 24),
                  backgroundColor: item.color,
                },
              ]}
            >
              <Text style={styles.timelineBlockTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {height > 30 && (
                <Text style={styles.timelineBlockTime}>
                  {formatTime(item.startTime)}-{formatTime(item.endTime)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ===================================================================
// 위클리 + 블록형 (요일 x 시간 그리드)
// ===================================================================
function WeeklyBlockView({
  days,
  visibleDays,
}: {
  days: Record<DayOfWeek, ScheduleItem[]>;
  visibleDays: { key: DayOfWeek; label: string }[];
}) {
  const totalHours = TIMELINE_END - TIMELINE_START;
  const timelineHeight = totalHours * HOUR_HEIGHT;
  const colCount = visibleDays.length;
  // 시간 라벨 너비 고려
  const timeColWidth = 30;
  const availWidth = SCREEN_WIDTH - 32 - timeColWidth; // padding 16*2
  const dayColWidth = availWidth / colCount;

  return (
    <View style={styles.weeklyContainer}>
      {/* 요일 헤더 */}
      <View style={styles.weeklyHeader}>
        <View style={{ width: timeColWidth }} />
        {visibleDays.map((d) => (
          <View key={d.key} style={[styles.weeklyHeaderCell, { width: dayColWidth }]}>
            <Text style={styles.weeklyHeaderText}>{d.label}</Text>
          </View>
        ))}
      </View>

      {/* 그리드 본체 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.weeklyGrid, { height: timelineHeight }]}>
          {/* 시간 라벨 열 */}
          <View style={{ width: timeColWidth }}>
            {Array.from({ length: totalHours + 1 }).map((_, i) => {
              const hour = TIMELINE_START + i;
              return (
                <View key={hour} style={[styles.weeklyTimeLabel, { top: i * HOUR_HEIGHT }]}>
                  <Text style={styles.weeklyTimeLabelText}>
                    {hour.toString().padStart(2, '0')}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 각 요일 열 */}
          {visibleDays.map((day) => {
            const items = days[day.key] ?? [];
            return (
              <View key={day.key} style={[styles.weeklyDayCol, { width: dayColWidth, height: timelineHeight }]}>
                {/* 가로 구분선 */}
                {Array.from({ length: totalHours + 1 }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.weeklyHourLine, { top: i * HOUR_HEIGHT }]}
                  />
                ))}
                {/* 일정 블록 */}
                {items.map((item) => {
                  const startMin = timeToMinutes(item.startTime);
                  const endMin = timeToMinutes(item.endTime);
                  const top = ((startMin - TIMELINE_START * 60) / 60) * HOUR_HEIGHT;
                  const height = ((endMin - startMin) / 60) * HOUR_HEIGHT - 1;
                  if (top < 0 || height <= 0) return null;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.weeklyBlock,
                        {
                          top,
                          height: Math.max(height, 16),
                          backgroundColor: item.color,
                        },
                      ]}
                    >
                      <Text style={styles.weeklyBlockText} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ===================================================================
// 데일리 + 원형
// ===================================================================
const CLOCK_SIZE = 240;
const CENTER = CLOCK_SIZE / 2;
const OUTER_R = 105;
const ARC_R = 85;

function DailyCircleView({ schedules, dayLabel, clockMode = '12h' }: { schedules: ScheduleItem[]; dayLabel: string; clockMode?: '12h' | '24h' }) {
  return (
    <View style={styles.circleContainer}>
      <Svg width={CLOCK_SIZE} height={CLOCK_SIZE} viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}>
        {/* 외곽 원 */}
        <Circle cx={CENTER} cy={CENTER} r={OUTER_R} fill={COLORS.background} stroke={COLORS.border} strokeWidth={3} />
        {/* 눈금 */}
        {Array.from({ length: clockMode === '24h' ? 24 : 12 }).map((_, i) => {
          const tickCount = clockMode === '24h' ? 24 : 12;
          const angle = degToRad(i * (360 / tickCount) - 90);
          const inner = OUTER_R - 8;
          const outer = OUTER_R - 2;
          return (
            <Line key={i}
              x1={CENTER + inner * Math.cos(angle)} y1={CENTER + inner * Math.sin(angle)}
              x2={CENTER + outer * Math.cos(angle)} y2={CENTER + outer * Math.sin(angle)}
              stroke={COLORS.border} strokeWidth={i % (clockMode === '24h' ? 6 : 3) === 0 ? 2.5 : 1}
            />
          );
        })}
        {/* 일정 Arc */}
        {schedules.map((item) => {
          const startAngle = minutesToAngle(timeToMinutes(item.startTime), clockMode);
          const endAngle = minutesToAngle(timeToMinutes(item.endTime), clockMode);
          return (
            <Path key={item.id} d={describeArc(CENTER, CENTER, ARC_R, startAngle, endAngle)}
              fill={item.color} opacity={0.7} stroke={COLORS.border} strokeWidth={1.5}
            />
          );
        })}
        {/* 중앙 */}
        <Circle cx={CENTER} cy={CENTER} r={22} fill={COLORS.accent} stroke={COLORS.border} strokeWidth={2.5} />
        <SvgText x={CENTER} y={CENTER + 6} textAnchor="middle" fontSize={16} fontFamily="Gaegu-Bold" fill={COLORS.textPrimary}>
          {dayLabel}
        </SvgText>
        {/* 시간 라벨 */}
        {(clockMode === '24h'
          ? [{ l: '0', a: -90 }, { l: '6', a: 0 }, { l: '12', a: 90 }, { l: '18', a: 180 }]
          : [{ l: '12', a: -90 }, { l: '3', a: 0 }, { l: '6', a: 90 }, { l: '9', a: 180 }]
        ).map((h) => {
          const labelR = OUTER_R - 20;
          const rad = degToRad(h.a);
          return (
            <SvgText key={h.l} x={CENTER + labelR * Math.cos(rad)} y={CENTER + labelR * Math.sin(rad) + 5}
              textAnchor="middle" fontSize={12} fontFamily="Gaegu-Bold" fill={COLORS.textSecondary}
            >{h.l}</SvgText>
          );
        })}
      </Svg>

      {/* 범례 */}
      {schedules.length > 0 ? (
        <View style={styles.legendList}>
          {schedules.map((item) => (
            <View key={item.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendTime}>{formatTime(item.startTime)}-{formatTime(item.endTime)}</Text>
              <Text style={styles.legendTitle} numberOfLines={1}>{item.title}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.circleEmptyText}>일정을 추가하면 시계 위에 표시돼요</Text>
      )}
    </View>
  );
}

// ===================================================================
// 위클리 + 원형 (요일별 미니 시계)
// ===================================================================
const MINI_CLOCK = 80;
const MINI_CENTER = MINI_CLOCK / 2;
const MINI_R = 32;
const MINI_ARC_R = 26;

function WeeklyCircleView({
  days,
  visibleDays,
}: {
  days: Record<DayOfWeek, ScheduleItem[]>;
  visibleDays: { key: DayOfWeek; label: string }[];
}) {
  return (
    <View style={styles.weeklyCircleWrap}>
      {visibleDays.map((day) => {
        const items = days[day.key] ?? [];
        return (
          <View key={day.key} style={styles.miniClockItem}>
            <Svg width={MINI_CLOCK} height={MINI_CLOCK} viewBox={`0 0 ${MINI_CLOCK} ${MINI_CLOCK}`}>
              <Circle cx={MINI_CENTER} cy={MINI_CENTER} r={MINI_R} fill={COLORS.background} stroke={COLORS.border} strokeWidth={2} />
              {/* 눈금 4개 */}
              {[0, 90, 180, 270].map((a) => {
                const rad = degToRad(a - 90);
                return (
                  <Line key={a}
                    x1={MINI_CENTER + (MINI_R - 5) * Math.cos(rad)} y1={MINI_CENTER + (MINI_R - 5) * Math.sin(rad)}
                    x2={MINI_CENTER + (MINI_R - 1) * Math.cos(rad)} y2={MINI_CENTER + (MINI_R - 1) * Math.sin(rad)}
                    stroke={COLORS.border} strokeWidth={1.5}
                  />
                );
              })}
              {/* 일정 */}
              {items.map((item) => {
                const sA = minutesToAngle(timeToMinutes(item.startTime));
                const eA = minutesToAngle(timeToMinutes(item.endTime));
                return (
                  <Path key={item.id} d={describeArc(MINI_CENTER, MINI_CENTER, MINI_ARC_R, sA, eA)}
                    fill={item.color} opacity={0.7} stroke={COLORS.border} strokeWidth={1}
                  />
                );
              })}
              {/* 중앙 */}
              <Circle cx={MINI_CENTER} cy={MINI_CENTER} r={10} fill={COLORS.accent} stroke={COLORS.border} strokeWidth={1.5} />
            </Svg>
            <Text style={styles.miniClockLabel}>{day.label}</Text>
            <Text style={styles.miniClockCount}>
              {items.length > 0 ? `${items.length}개` : '-'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ===================================================================
// 일정 추가 모달
// ===================================================================
function AddScheduleModal({
  visible, onClose, onAdd,
  title, onTitleChange,
  startH, startM, endH, endM,
  onStartHChange, onStartMChange, onEndHChange, onEndMChange,
  color, onColorChange,
  isEdit = false,
  applyAllDays, onApplyAllDaysChange,
}: {
  visible: boolean; onClose: () => void; onAdd: () => void;
  title: string; onTitleChange: (v: string) => void;
  startH: string; startM: string; endH: string; endM: string;
  onStartHChange: (v: string) => void; onStartMChange: (v: string) => void;
  onEndHChange: (v: string) => void; onEndMChange: (v: string) => void;
  color: string; onColorChange: (v: string) => void;
  isEdit?: boolean;
  applyAllDays?: boolean;
  onApplyAllDaysChange?: (v: boolean) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <Text style={styles.modalTitle}>{isEdit ? '일정 편집' : '새 일정'}</Text>

          <Text style={styles.inputLabel}>제목</Text>
          <TextInput
            style={styles.textInput}
            placeholder="수업, 약속 등..."
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={onTitleChange}
          />

          {/* 시작/종료 시간 한 줄로 */}
          <View style={styles.timeSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>시작</Text>
              <View style={styles.timeRow}>
                <TextInput style={styles.timeInput} keyboardType="number-pad" maxLength={2} value={startH} onChangeText={onStartHChange} />
                <Text style={styles.timeColon}>:</Text>
                <TextInput style={styles.timeInput} keyboardType="number-pad" maxLength={2} value={startM} onChangeText={onStartMChange} />
              </View>
            </View>
            <Text style={styles.timeArrow}>→</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>종료</Text>
              <View style={styles.timeRow}>
                <TextInput style={styles.timeInput} keyboardType="number-pad" maxLength={2} value={endH} onChangeText={onEndHChange} />
                <Text style={styles.timeColon}>:</Text>
                <TextInput style={styles.timeInput} keyboardType="number-pad" maxLength={2} value={endM} onChangeText={onEndMChange} />
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>색상</Text>
          <View style={styles.colorRow}>
            {SCHEDULE_COLORS.map((c) => (
              <TouchableOpacity key={c} onPress={() => onColorChange(c)}
                style={[styles.colorChip, { backgroundColor: c }, color === c && styles.colorChipSelected]}
              />
            ))}
          </View>

          {/* 모든 요일에 적용 토글 (편집 모드가 아닐 때만) */}
          {!isEdit && onApplyAllDaysChange && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onApplyAllDaysChange(!applyAllDays)}
              style={styles.allDaysToggle}
            >
              <View style={[styles.allDaysCheckbox, applyAllDays && styles.allDaysCheckboxChecked]}>
                {applyAllDays && <Text style={styles.allDaysCheck}>✓</Text>}
              </View>
              <Text style={styles.allDaysLabel}>모든 요일에 적용</Text>
            </TouchableOpacity>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity activeOpacity={0.7} style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.modalConfirmBtn} onPress={onAdd}>
              <Text style={styles.modalConfirmText}>{isEdit ? '저장' : '추가'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ===================================================================
// 스타일
// ===================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // 빈 상태
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: 'Gaegu', fontSize: 18, color: COLORS.textSecondary },

  // ── 상단 컨트롤 바 ──
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  toggleChipActive: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  toggleChipText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  toggleChipTextActive: {
    color: COLORS.textPrimary,
  },

  // ── 요일 행 ──
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  dayTabs: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  dayChipText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dayChipTextSelected: {
    color: COLORS.textPrimary,
  },
  weeklyLabel: {
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  weekendToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  weekendToggleActive: {
    backgroundColor: '#E6F3FF',
  },
  weekendToggleText: {
    fontFamily: 'Gaegu',
    fontSize: 12,
    color: COLORS.textPrimary,
  },

  // ── 콘텐츠 ──
  contentScroll: { flex: 1 },

  // ── 데일리 블록 (타임라인) ──
  timelineContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  timelineInner: {
    position: 'relative',
  },
  timelineRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 0,
  },
  timelineLabel: {
    width: 28,
    fontFamily: 'Gaegu',
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginRight: 6,
  },
  timelineLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  timelineBlock: {
    position: 'absolute',
    left: 38,
    right: 4,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  timelineBlockTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  timelineBlockTime: {
    fontFamily: 'Gaegu',
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // 빈 일정
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyStateEmoji: { fontSize: 40, marginBottom: 12 },
  emptyStateText: { fontFamily: 'Gaegu-Bold', fontSize: 20, color: COLORS.textPrimary, marginBottom: 4 },
  emptyStateSubText: { fontFamily: 'Gaegu', fontSize: 15, color: COLORS.textMuted },

  // ── 위클리 블록 (그리드) ──
  weeklyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  weeklyHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weeklyHeaderCell: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  weeklyHeaderText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  weeklyGrid: {
    flexDirection: 'row',
    position: 'relative',
  },
  weeklyTimeLabel: {
    position: 'absolute',
    left: 0,
    height: 0,
  },
  weeklyTimeLabelText: {
    fontFamily: 'Gaegu',
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: -6,
  },
  weeklyDayCol: {
    position: 'relative',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  weeklyHourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  weeklyBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  weeklyBlockText: {
    fontFamily: 'Gaegu',
    fontSize: 9,
    color: COLORS.textPrimary,
  },

  // ── 원형 (데일리) ──
  circleContainer: { alignItems: 'center', paddingTop: 16, paddingHorizontal: 16 },
  circleEmptyText: { fontFamily: 'Gaegu', fontSize: 14, color: COLORS.textMuted, marginTop: 16 },
  legendList: { marginTop: 16, width: '100%', gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border },
  legendTime: { fontFamily: 'Gaegu', fontSize: 13, color: COLORS.textSecondary, width: 90 },
  legendTitle: { fontFamily: 'Gaegu-Bold', fontSize: 14, color: COLORS.textPrimary, flex: 1 },

  // ── 원형 (위클리 미니 시계) ──
  weeklyCircleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  miniClockItem: {
    alignItems: 'center',
    gap: 4,
  },
  miniClockLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  miniClockCount: {
    fontFamily: 'Gaegu',
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // ── 하단 일정 추가 ──
  addArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  addButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },

  // ── 모달 ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'Gaegu',
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeInput: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: 'Gaegu',
    fontSize: 18,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    width: 48,
    textAlign: 'center',
  },
  timeColon: { fontFamily: 'Gaegu-Bold', fontSize: 18, color: COLORS.textPrimary },
  timeArrow: { fontFamily: 'Gaegu-Bold', fontSize: 18, color: COLORS.textMuted, marginBottom: 10 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorChip: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2.5, borderColor: COLORS.border,
  },
  colorChipSelected: {
    shadowColor: COLORS.shadow, shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
    transform: [{ scale: 1.15 }],
  },
  allDaysToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 12,
  },
  allDaysCheckbox: {
    width: 22,
    height: 22,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  allDaysCheckboxChecked: {
    backgroundColor: COLORS.accent,
  },
  allDaysCheck: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  allDaysLabel: {
    fontFamily: 'Gaegu',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  modalActions: { flexDirection: 'row' as const, gap: 12, marginTop: 16 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 10,
    borderWidth: 2.5, borderColor: COLORS.border, borderRadius: 10,
    backgroundColor: COLORS.surface, alignItems: 'center',
    shadowColor: COLORS.shadow, shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  modalCancelText: { fontFamily: 'Gaegu-Bold', fontSize: 16, color: COLORS.textSecondary },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 10,
    borderWidth: 2.5, borderColor: COLORS.border, borderRadius: 10,
    backgroundColor: COLORS.accent, alignItems: 'center',
    shadowColor: COLORS.shadow, shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  modalConfirmText: { fontFamily: 'Gaegu-Bold', fontSize: 16, color: COLORS.textPrimary },
});
