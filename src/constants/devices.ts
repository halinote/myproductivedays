// 내보내기용 기기 해상도 프리셋
export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  emoji: string;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  // iPhone
  { id: 'iphone15pro', name: 'iPhone 15 Pro', width: 1179, height: 2556, emoji: '📱' },
  { id: 'iphone15promax', name: 'iPhone 15 Pro Max', width: 1290, height: 2796, emoji: '📱' },
  { id: 'iphone16pro', name: 'iPhone 16 Pro', width: 1206, height: 2622, emoji: '📱' },
  { id: 'iphone16promax', name: 'iPhone 16 Pro Max', width: 1320, height: 2868, emoji: '📱' },
  // Galaxy
  { id: 'galaxys24', name: 'Galaxy S24', width: 1080, height: 2340, emoji: '🤖' },
  { id: 'galaxys24ultra', name: 'Galaxy S24 Ultra', width: 1440, height: 3120, emoji: '🤖' },
  // 범용
  { id: 'fhd', name: 'Full HD (1080p)', width: 1080, height: 1920, emoji: '🖥️' },
  { id: 'qhd', name: 'QHD (1440p)', width: 1440, height: 2560, emoji: '🖥️' },
];
