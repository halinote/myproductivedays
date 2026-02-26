import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { DoodleCard } from '@/components/common';
import { WIDGET_TYPES, COLORS } from '@/constants';
import { useProjectStore, ProjectMode } from '@/stores/useProjectStore';
import type { WidgetTypeId } from '@/constants';

// 배경화면 / 위젯 타입 선택 화면
export default function TypeSelectScreen() {
  const router = useRouter();
  const createProject = useProjectStore((s) => s.createProject);
  const [mode, setMode] = useState<ProjectMode>('wallpaper');

  const handleSelect = (typeId: WidgetTypeId) => {
    createProject(mode, typeId);
    router.push('/editor');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>타입 선택</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* 모드 토글: 배경화면 / 위젯 */}
      <View style={styles.modeToggle}>
        <Pressable
          onPress={() => setMode('wallpaper')}
          style={[
            styles.modeBtn,
            mode === 'wallpaper' && styles.modeBtnActive,
          ]}
        >
          <Text
            style={[
              styles.modeBtnText,
              mode === 'wallpaper' && styles.modeBtnTextActive,
            ]}
          >
            배경화면
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('widget')}
          style={[styles.modeBtn, mode === 'widget' && styles.modeBtnActive]}
        >
          <Text
            style={[
              styles.modeBtnText,
              mode === 'widget' && styles.modeBtnTextActive,
            ]}
          >
            위젯
          </Text>
        </Pressable>
      </View>

      {/* 설명 */}
      <Text style={styles.subtitle}>
        {mode === 'wallpaper'
          ? '어떤 스타일의 배경화면을 만들까요?'
          : '어떤 위젯을 만들까요?'}
      </Text>

      {/* 위젯 타입 그리드 — 5개: 2-2-1 배치 */}
      <ScrollView contentContainerStyle={styles.grid}>
        {/* 상위 4개: 2열 그리드 */}
        <View style={styles.gridRow}>
          {WIDGET_TYPES.slice(0, 2).map((type) => (
            <TypeCard
              key={type.id}
              type={type}
              mode={mode}
              onSelect={handleSelect}
            />
          ))}
        </View>
        <View style={styles.gridRow}>
          {WIDGET_TYPES.slice(2, 4).map((type) => (
            <TypeCard
              key={type.id}
              type={type}
              mode={mode}
              onSelect={handleSelect}
            />
          ))}
        </View>
        {/* 마지막 1개: 풀 너비 */}
        {WIDGET_TYPES[4] && (
          <TypeCardWide
            type={WIDGET_TYPES[4]}
            mode={mode}
            onSelect={handleSelect}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 일반 카드 (2열)
function TypeCard({
  type,
  mode,
  onSelect,
}: {
  type: (typeof WIDGET_TYPES)[number];
  mode: ProjectMode;
  onSelect: (id: WidgetTypeId) => void;
}) {
  return (
    <DoodleCard
      bgColor={type.color}
      onPress={() => onSelect(type.id)}
      style={styles.typeCard}
    >
      <Text style={styles.emoji}>{type.emoji}</Text>
      <Text style={styles.typeTitle}>{type.title}</Text>
      <Text style={styles.typeDesc}>{type.desc}</Text>
      {mode === 'widget' && (
        <View style={styles.interactiveBadge}>
          <Text style={styles.badgeText}>인터랙티브</Text>
        </View>
      )}
    </DoodleCard>
  );
}

// 풀 너비 카드 (마지막 다꾸)
function TypeCardWide({
  type,
  mode,
  onSelect,
}: {
  type: (typeof WIDGET_TYPES)[number];
  mode: ProjectMode;
  onSelect: (id: WidgetTypeId) => void;
}) {
  return (
    <DoodleCard
      bgColor={type.color}
      onPress={() => onSelect(type.id)}
      style={styles.typeCardWide}
    >
      <View style={styles.wideInner}>
        <Text style={[styles.emoji, { fontSize: 40 }]}>{type.emoji}</Text>
        <View style={styles.wideText}>
          <Text style={styles.typeTitle}>{type.title}</Text>
          <Text style={styles.typeDesc}>{type.desc}</Text>
        </View>
      </View>
      {mode === 'widget' && (
        <View style={[styles.interactiveBadge, { alignSelf: 'flex-start', marginTop: 8 }]}>
          <Text style={styles.badgeText}>인터랙티브</Text>
        </View>
      )}
    </DoodleCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  modeBtnActive: {
    backgroundColor: COLORS.accent,
  },
  modeBtnText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  modeBtnTextActive: {
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Gaegu',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  // 2열 카드
  typeCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  typeDesc: {
    fontFamily: 'Gaegu',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // 풀 너비 카드
  typeCardWide: {
    width: '100%',
    padding: 20,
  },
  wideInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  wideText: {
    flex: 1,
  },
  // 뱃지
  interactiveBadge: {
    marginTop: 8,
    backgroundColor: '#E6F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  badgeText: {
    fontFamily: 'Gaegu',
    fontSize: 11,
    color: COLORS.textPrimary,
  },
});
