import { View, Text, StyleSheet } from 'react-native';

interface IOSOverlayProps {
  canvasWidth: number;
  showGuideline: boolean;
}

// 리얼한 iOS 상태바 + 홈 인디케이터 오버레이
export default function IOSOverlay({
  canvasWidth,
  showGuideline,
}: IOSOverlayProps) {
  // 캔버스 크기 대비 비율 계산 (iPhone 15 Pro 기준)
  const scaleFactor = canvasWidth / 393;
  const statusBarHeight = 54 * scaleFactor;
  const homeIndicatorHeight = 34 * scaleFactor;
  const fontSize = (s: number) => s * scaleFactor;

  // 현재 시간
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <>
      {/* 상태바 영역 */}
      <View
        style={[
          styles.statusBar,
          {
            height: statusBarHeight,
            backgroundColor: showGuideline
              ? 'rgba(248,113,113,0.08)'
              : 'transparent',
            borderBottomWidth: showGuideline ? 1 : 0,
            borderBottomColor: 'rgba(248,113,113,0.3)',
          },
        ]}
      >
        {/* 시간 (좌측) */}
        <Text
          style={[
            styles.statusTime,
            { fontSize: fontSize(15), lineHeight: statusBarHeight },
          ]}
        >
          {timeStr}
        </Text>

        {/* 다이나믹 아일랜드 (중앙) */}
        <View
          style={[
            styles.dynamicIsland,
            {
              width: 120 * scaleFactor,
              height: 36 * scaleFactor,
              borderRadius: 18 * scaleFactor,
              top: 10 * scaleFactor,
            },
          ]}
        />

        {/* 우측 아이콘들 (셀룰러 + 와이파이 + 배터리) */}
        <View style={styles.statusRight}>
          {/* 셀룰러 바 */}
          <View style={[styles.cellularBars, { gap: 1.5 * scaleFactor }]}>
            {[0.4, 0.55, 0.7, 0.85].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.cellularBar,
                  {
                    width: 3 * scaleFactor,
                    height: 12 * h * scaleFactor,
                    borderRadius: 1 * scaleFactor,
                  },
                ]}
              />
            ))}
          </View>

          {/* 와이파이 */}
          <Text style={{ fontSize: fontSize(12), marginHorizontal: 3 * scaleFactor }}>
            ᯤ
          </Text>

          {/* 배터리 */}
          <View
            style={[
              styles.battery,
              {
                width: 25 * scaleFactor,
                height: 12 * scaleFactor,
                borderRadius: 3 * scaleFactor,
                borderWidth: 1.2 * scaleFactor,
              },
            ]}
          >
            <View
              style={[
                styles.batteryFill,
                {
                  width: '75%',
                  borderRadius: 1.5 * scaleFactor,
                  margin: 1.5 * scaleFactor,
                },
              ]}
            />
            <View
              style={[
                styles.batteryTip,
                {
                  width: 2 * scaleFactor,
                  height: 5 * scaleFactor,
                  borderTopRightRadius: 1.5 * scaleFactor,
                  borderBottomRightRadius: 1.5 * scaleFactor,
                  right: -3.5 * scaleFactor,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 홈 인디케이터 영역 */}
      <View
        style={[
          styles.homeArea,
          {
            height: homeIndicatorHeight,
            backgroundColor: showGuideline
              ? 'rgba(248,113,113,0.08)'
              : 'transparent',
            borderTopWidth: showGuideline ? 1 : 0,
            borderTopColor: 'rgba(248,113,113,0.3)',
          },
        ]}
      >
        {/* 홈 인디케이터 바 */}
        <View
          style={[
            styles.homeBar,
            {
              width: 134 * scaleFactor,
              height: 5 * scaleFactor,
              borderRadius: 2.5 * scaleFactor,
              bottom: 8 * scaleFactor,
            },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // 상태바
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  statusTime: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dynamicIsland: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -60,
    backgroundColor: '#1A1A1A',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellularBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cellularBar: {
    backgroundColor: '#1A1A1A',
  },
  battery: {
    borderColor: '#1A1A1A',
    position: 'relative',
    justifyContent: 'center',
  },
  batteryFill: {
    backgroundColor: '#1A1A1A',
    height: '100%',
  },
  batteryTip: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    opacity: 0.4,
  },
  // 홈 인디케이터
  homeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 10,
  },
  homeBar: {
    backgroundColor: '#1A1A1A',
    opacity: 0.25,
  },
});
