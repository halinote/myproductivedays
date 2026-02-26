import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Download, Check } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, DEVICE_PRESETS, DevicePreset } from '@/constants';
import { DOODLE_BORDER_RADIUS } from '@/constants/styles';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  captureViewRef: React.RefObject<View | null>;
}

// 해상도 선택 + 이미지 내보내기 모달
export default function ExportModal({ visible, onClose, captureViewRef }: ExportModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [exporting, setExporting] = useState(false);

  // 선택한 해상도로 이미지 캡처 → 갤러리 저장
  const handleExport = async () => {
    if (!captureViewRef.current) return;
    try {
      setExporting(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 저장을 위해 갤러리 접근 권한이 필요합니다.');
        return;
      }
      const uri = await captureRef(captureViewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: selectedDevice.width,
        height: selectedDevice.height,
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(
        '저장 완료!',
        `${selectedDevice.name} (${selectedDevice.width}×${selectedDevice.height}) 해상도로 갤러리에 저장되었습니다.`,
      );
      onClose();
    } catch (e) {
      console.error('Export failed:', e);
      Alert.alert('저장 실패', '이미지 저장 중 문제가 발생했습니다.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>배경화면 내보내기</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {/* 설명 */}
          <Text style={styles.desc}>기기에 맞는 해상도를 선택해주세요</Text>

          {/* 해상도 목록 */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {DEVICE_PRESETS.map((device) => {
              const isSelected = selectedDevice.id === device.id;
              return (
                <Pressable
                  key={device.id}
                  onPress={() => setSelectedDevice(device)}
                  style={[styles.deviceRow, isSelected && styles.deviceRowSelected]}
                >
                  <Text style={styles.deviceEmoji}>{device.emoji}</Text>
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, isSelected && styles.deviceNameSelected]}>
                      {device.name}
                    </Text>
                    <Text style={styles.deviceRes}>
                      {device.width} × {device.height}
                    </Text>
                  </View>
                  {isSelected && (
                    <Check size={20} color={COLORS.accent} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 내보내기 버튼 — ScrollView 바깥, 항상 하단 고정 */}
          <View style={styles.exportBtnWrapper}>
            <Pressable
              onPress={handleExport}
              disabled={exporting}
              style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
            >
              {exporting ? (
                <ActivityIndicator color={COLORS.textPrimary} />
              ) : (
                <>
                  <Download size={20} color={COLORS.textPrimary} />
                  <Text style={styles.exportBtnText}>
                    {selectedDevice.name}으로 저장
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.border,
    paddingTop: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  desc: {
    fontFamily: 'Gaegu',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  list: {
    flexGrow: 0,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 8,
  },
  // 기기 목록 아이템
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 2.5,
    borderColor: COLORS.editorBg,
    ...DOODLE_BORDER_RADIUS,
    backgroundColor: COLORS.surface,
  },
  deviceRowSelected: {
    borderColor: COLORS.border,
    backgroundColor: '#FFFDF9',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  deviceEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  deviceNameSelected: {
    color: COLORS.textPrimary,
  },
  deviceRes: {
    fontFamily: 'Gaegu',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  // 내보내기 버튼 래퍼 — 스크롤 영역 바깥 고정
  exportBtnWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderWidth: 3,
    borderColor: COLORS.border,
    ...DOODLE_BORDER_RADIUS,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    color: COLORS.textPrimary,
  },
});
