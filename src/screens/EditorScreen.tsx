import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { ArrowLeft, Undo2, Redo2, Save, Download, Palette } from 'lucide-react-native';
import { useProjectStore } from '@/stores/useProjectStore';
import { COLORS } from '@/constants';
import TimetableEditor from '@/components/editor/TimetableEditor';
import TimeGaugeEditor from '@/components/editor/TimeGaugeEditor';
import LifeProgressEditor from '@/components/editor/LifeProgressEditor';
import MottoEditor from '@/components/editor/MottoEditor';
import MixMatchEditor from '@/components/editor/MixMatchEditor';
import ExportModal from '@/components/editor/ExportModal';

// 배경색 팔레트
const BG_COLORS = [
  '#FFFDF9', '#FFFFFF', '#F3F4F6', '#1A1A1A',
  '#FFDE59', '#91D0FF', '#FF91AD', '#F0FFF4',
  '#E6F3FF', '#FFF0F5', '#FFD6E0', '#C1F0C1',
];

// Editor 화면 — 위젯 타입에 따라 전용 에디터 렌더링
export default function EditorScreen() {
  const router = useRouter();
  const currentProject = useProjectStore((s) => s.currentProject);
  const saveProject = useProjectStore((s) => s.saveProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.canUndo());
  const canRedo = useProjectStore((s) => s.canRedo());
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);
  const captureViewRef = useRef<View>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBgPalette, setShowBgPalette] = useState(false);

  const handleSave = () => {
    saveProject();
    router.back();
  };

  // 위젯 타입별 에디터 컴포넌트 선택
  const renderEditor = () => {
    if (!currentProject) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>프로젝트를 선택해주세요</Text>
        </View>
      );
    }

    switch (currentProject.widgetType) {
      case 'timetable':
        return <TimetableEditor captureRef={captureViewRef} />;
      case 'timegauge':
        return <TimeGaugeEditor captureRef={captureViewRef} />;
      case 'progress':
        return <LifeProgressEditor captureRef={captureViewRef} />;
      case 'motto':
        return <MottoEditor captureRef={captureViewRef} />;
      case 'mixmatch':
        return <MixMatchEditor captureRef={captureViewRef} />;
      default:
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>알 수 없는 위젯 타입</Text>
          </View>
        );
    }
  };

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* 상단 툴바 */}
          <View style={styles.toolbar}>
            <Pressable onPress={() => router.back()} style={styles.toolbarBtn}>
              <ArrowLeft size={24} color={COLORS.textPrimary} />
            </Pressable>
            <Text style={styles.toolbarTitle}>
              {currentProject?.title ?? '편집'}
            </Text>
            <View style={styles.toolbarRight}>
              <Pressable onPress={undo} disabled={!canUndo} style={[styles.toolbarBtn, !canUndo && styles.toolbarBtnDisabled]}>
                <Undo2 size={22} color={canUndo ? COLORS.textPrimary : COLORS.textMuted} />
              </Pressable>
              <Pressable onPress={redo} disabled={!canRedo} style={[styles.toolbarBtn, !canRedo && styles.toolbarBtnDisabled]}>
                <Redo2 size={22} color={canRedo ? COLORS.textPrimary : COLORS.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => setShowBgPalette(!showBgPalette)}
                style={styles.toolbarBtn}
              >
                <Palette size={22} color={COLORS.textPrimary} />
              </Pressable>
              <Pressable
                onPress={() => setShowExportModal(true)}
                style={[styles.toolbarBtn, styles.exportBtn]}
              >
                <Download size={22} color={COLORS.textPrimary} />
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.toolbarBtn, styles.saveBtn]}
              >
                <Save size={22} color="white" />
              </Pressable>
            </View>
          </View>

          {/* 배경색 팔레트 */}
          {showBgPalette && (
            <View style={styles.bgPaletteRow}>
              {BG_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    updateCurrentProject({ bgColor: c });
                    setShowBgPalette(false);
                  }}
                  style={[
                    styles.bgColorDot,
                    { backgroundColor: c },
                    currentProject?.bgColor === c && styles.bgColorDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* 위젯별 전용 에디터 */}
          {renderEditor()}
        </SafeAreaView>
      </GestureHandlerRootView>

      {/* 해상도 선택 내보내기 모달 — GestureHandler 바깥 */}
      <ExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        captureViewRef={captureViewRef}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // 툴바
  toolbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 2.5,
    borderBottomColor: COLORS.border,
  },
  toolbarBtn: {
    padding: 8,
  },
  toolbarBtnDisabled: {
    opacity: 0.35,
  },
  exportBtn: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  toolbarTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 4,
  },
  // 배경색 팔레트
  bgPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  bgColorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  bgColorDotActive: {
    borderWidth: 3,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Gaegu',
    fontSize: 18,
    color: COLORS.textMuted,
  },
});
