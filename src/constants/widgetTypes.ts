// 위젯 타입 정의 — 원형시계는 타임테이블에 통합
export type WidgetTypeId = 'timetable' | 'timegauge' | 'progress' | 'motto' | 'mixmatch';

export interface WidgetType {
  id: WidgetTypeId;
  title: string;
  desc: string;
  emoji: string;
  color: string;
}

export const WIDGET_TYPES: WidgetType[] = [
  { id: 'timetable', emoji: '📅', title: '타임테이블', desc: '요일별 시간표 + 원형시계', color: '#E6F3FF' },
  { id: 'timegauge', emoji: '⏳', title: '타임 게이지', desc: '하루의 흐름을 시각화', color: '#FFF8E1' },
  { id: 'progress', emoji: '🌱', title: '라이프 프로그레스', desc: '인생의 진행률 표시', color: '#F0FFF4' },
  { id: 'motto', emoji: '✍️', title: '모토 & 낙서', desc: '나만의 문구 꾸미기', color: '#FFF0F5' },
  { id: 'mixmatch', emoji: '🎨', title: '다꾸 믹스앤매치', desc: '자유롭게 다이어리 꾸미기', color: '#FFDE59' },
];
