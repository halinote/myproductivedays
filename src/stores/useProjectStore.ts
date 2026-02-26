import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetTypeId } from '@/constants';

// 프로젝트(작업물) 모드
export type ProjectMode = 'wallpaper' | 'widget';

// 요일 타입
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
];

// --- 타임테이블 ---
export interface ScheduleItem {
  id: string;
  startTime: string;    // "09:00"
  endTime: string;      // "10:30"
  title: string;
  color: string;
  emoji?: string;
}

export type TimetableViewType = 'block' | 'circle';
export type TimetableLayoutMode = 'daily' | 'weekly';

export interface TimetableData {
  viewType: TimetableViewType;
  layoutMode: TimetableLayoutMode;
  clockMode: '12h' | '24h';
  showWeekend: boolean;
  selectedDay: DayOfWeek;
  days: Record<DayOfWeek, ScheduleItem[]>;
}

// --- 타임 게이지 ---
export type GaugeStyle = 'horizontal' | 'vertical' | 'circular' | 'water' | 'battery';

export interface TimeGaugeData {
  gaugeStyle: GaugeStyle;
  startTime: string;
  endTime: string;
  displayFormat: 'percent' | 'remaining' | 'elapsed';
  label: string;
  fillColor: string;
  bgColor?: string;
  textColor?: string;
  character?: string;
}

// --- 라이프 프로그레스 ---
export type LifeDesignType = 'bar' | 'dots' | 'tree' | 'book' | 'moon' | 'pixel';

export interface LifeProgressData {
  birthDate: string;          // "1996-03-15"
  expectedLifespan: number;   // 80
  displayUnit: 'year' | 'month' | 'week' | 'day';
  designType: LifeDesignType;
  showDetails: boolean;
  motto?: string;
  filledColor: string;
  remainingColor: string;
  textColor?: string;
}

// --- 모토 낙서 ---
export type MottoTemplate = 'center' | 'bubble' | 'postit' | 'typewriter' | 'notebook' | 'stamp' | 'neon' | 'collage';

export interface MottoText {
  id: string;
  content: string;
  fontSize: number;
  fontFamily?: string;
  color: string;
  align: 'left' | 'center' | 'right';
  rotation: number;
  position: { x: number; y: number };
  emphasis?: 'underline' | 'highlight' | 'circle';
}

export interface MottoData {
  template: MottoTemplate;
  texts: MottoText[];
}

// --- 다꾸 믹스앤매치 ---
export type MixElementType = 'photo' | 'stamp' | 'sticker' | 'text' | 'shape' | 'tape' | 'frame';

export interface MixElement {
  id: string;
  type: MixElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  opacity: number;
  // 타입별 데이터
  content: string;      // 텍스트, 이모지, 에셋 ID 등
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  uri?: string;         // 사진 URI
}

// 캔버스 위 배치되는 범용 블록 요소 (하위호환)
export interface BlockElement {
  id: string;
  type: 'hour' | 'half' | 'important' | 'text' | 'stamp';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label?: string;
}

// 하나의 프로젝트(작업물) 데이터
export interface Project {
  id: string;
  mode: ProjectMode;
  widgetType: WidgetTypeId;
  title: string;
  bgColor: string;
  bgImage?: string;
  createdAt: number;
  updatedAt: number;
  // 위젯별 데이터 (하나만 존재)
  timetableData?: TimetableData;
  timeGaugeData?: TimeGaugeData;
  lifeProgressData?: LifeProgressData;
  mottoData?: MottoData;
  mixElements?: MixElement[];
  // 범용 (하위호환)
  elements: BlockElement[];
}

// 기본 타임테이블 데이터 생성
function createDefaultTimetable(): TimetableData {
  const emptyDays = {} as Record<DayOfWeek, ScheduleItem[]>;
  DAYS.forEach((d) => { emptyDays[d.key] = []; });
  return {
    viewType: 'block',
    layoutMode: 'daily' as TimetableLayoutMode,
    clockMode: '12h',
    showWeekend: true,
    selectedDay: 'mon',
    days: emptyDays,
  };
}

// 기본 타임 게이지 데이터
function createDefaultTimeGauge(): TimeGaugeData {
  return {
    gaugeStyle: 'horizontal',
    startTime: '00:00',
    endTime: '24:00',
    displayFormat: 'percent',
    label: '오늘 하루',
    fillColor: '#FFDE59',
  };
}

// 기본 라이프 프로그레스 데이터
function createDefaultLifeProgress(): LifeProgressData {
  return {
    birthDate: '2000-01-01',
    expectedLifespan: 80,
    displayUnit: 'year',
    designType: 'bar',
    showDetails: true,
    filledColor: '#FFDE59',
    remainingColor: '#F3F4F6',
  };
}

// 기본 모토 데이터
function createDefaultMotto(): MottoData {
  return {
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
}

const MAX_HISTORY = 50;

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;

  // Undo/Redo
  _history: Project[];
  _future: Project[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // 액션
  createProject: (mode: ProjectMode, widgetType: WidgetTypeId) => void;
  setCurrentProject: (project: Project | null) => void;
  updateCurrentProject: (updates: Partial<Project>) => void;
  // 타임테이블 전용
  addScheduleItem: (day: DayOfWeek, item: ScheduleItem) => void;
  removeScheduleItem: (day: DayOfWeek, itemId: string) => void;
  updateScheduleItem: (day: DayOfWeek, itemId: string, updates: Partial<ScheduleItem>) => void;
  setSelectedDay: (day: DayOfWeek) => void;
  setTimetableViewType: (viewType: TimetableViewType) => void;
  // 범용 요소
  addElement: (element: BlockElement) => void;
  updateElement: (id: string, updates: Partial<BlockElement>) => void;
  removeElement: (id: string) => void;
  // 다꾸 요소
  addMixElement: (element: MixElement) => void;
  updateMixElement: (id: string, updates: Partial<MixElement>) => void;
  removeMixElement: (id: string) => void;
  // 저장/삭제
  saveProject: () => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
  (set, get) => ({
  projects: [],
  currentProject: null,
  _history: [],
  _future: [],

  // Undo — 이전 상태로 복원
  undo: () => {
    const { _history, currentProject } = get();
    if (_history.length === 0 || !currentProject) return;
    const prev = _history[_history.length - 1];
    set({
      currentProject: prev,
      _history: _history.slice(0, -1),
      _future: [currentProject, ...get()._future].slice(0, MAX_HISTORY),
    });
  },

  // Redo — 되돌린 상태 복원
  redo: () => {
    const { _future, currentProject } = get();
    if (_future.length === 0 || !currentProject) return;
    const next = _future[0];
    set({
      currentProject: next,
      _history: [...get()._history, currentProject].slice(-MAX_HISTORY),
      _future: _future.slice(1),
    });
  },

  canUndo: () => get()._history.length > 0,
  canRedo: () => get()._future.length > 0,

  // 새 프로젝트 생성 — 위젯 타입별 기본 데이터 세팅
  createProject: (mode, widgetType) => {
    const base: Project = {
      id: Date.now().toString(),
      mode,
      widgetType,
      title: '새 배경화면',
      elements: [],
      bgColor: '#FFFDF9',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 위젯별 초기 데이터
    if (widgetType === 'timetable') {
      base.title = '새 타임테이블';
      base.timetableData = createDefaultTimetable();
    } else if (widgetType === 'timegauge') {
      base.title = '새 타임 게이지';
      base.timeGaugeData = createDefaultTimeGauge();
    } else if (widgetType === 'progress') {
      base.title = '라이프 프로그레스';
      base.lifeProgressData = createDefaultLifeProgress();
    } else if (widgetType === 'motto') {
      base.title = '모토 & 낙서';
      base.mottoData = createDefaultMotto();
    } else if (widgetType === 'mixmatch') {
      base.title = '다꾸 믹스앤매치';
      base.mixElements = [];
    }

    set({ currentProject: base });
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  updateCurrentProject: (updates) => {
    const { currentProject, _history } = get();
    if (!currentProject) return;
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: { ...currentProject, ...updates, updatedAt: Date.now() },
    });
  },

  // --- 타임테이블 전용 액션 ---
  addScheduleItem: (day, item) => {
    const { currentProject, _history } = get();
    if (!currentProject?.timetableData) return;
    const days = { ...currentProject.timetableData.days };
    const items = [...days[day], item].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    days[day] = items;
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        timetableData: { ...currentProject.timetableData, days },
        updatedAt: Date.now(),
      },
    });
  },

  removeScheduleItem: (day, itemId) => {
    const { currentProject, _history } = get();
    if (!currentProject?.timetableData) return;
    const days = { ...currentProject.timetableData.days };
    days[day] = days[day].filter((i) => i.id !== itemId);
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        timetableData: { ...currentProject.timetableData, days },
        updatedAt: Date.now(),
      },
    });
  },

  updateScheduleItem: (day, itemId, updates) => {
    const { currentProject, _history } = get();
    if (!currentProject?.timetableData) return;
    const days = { ...currentProject.timetableData.days };
    days[day] = days[day]
      .map((i) => (i.id === itemId ? { ...i, ...updates } : i))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        timetableData: { ...currentProject.timetableData, days },
        updatedAt: Date.now(),
      },
    });
  },

  setSelectedDay: (day) => {
    const { currentProject } = get();
    if (!currentProject?.timetableData) return;
    set({
      currentProject: {
        ...currentProject,
        timetableData: { ...currentProject.timetableData, selectedDay: day },
      },
    });
  },

  setTimetableViewType: (viewType) => {
    const { currentProject } = get();
    if (!currentProject?.timetableData) return;
    set({
      currentProject: {
        ...currentProject,
        timetableData: { ...currentProject.timetableData, viewType },
      },
    });
  },

  // --- 범용 요소 ---
  addElement: (element) => {
    const { currentProject, _history } = get();
    if (!currentProject) return;
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        elements: [...currentProject.elements, element],
        updatedAt: Date.now(),
      },
    });
  },

  updateElement: (id, updates) => {
    const { currentProject, _history } = get();
    if (!currentProject) return;
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        elements: currentProject.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
        updatedAt: Date.now(),
      },
    });
  },

  removeElement: (id) => {
    const { currentProject, _history } = get();
    if (!currentProject) return;
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        elements: currentProject.elements.filter((el) => el.id !== id),
        updatedAt: Date.now(),
      },
    });
  },

  // --- 다꾸 요소 ---
  addMixElement: (element) => {
    const { currentProject, _history } = get();
    if (!currentProject) return;
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        mixElements: [...(currentProject.mixElements ?? []), element],
        updatedAt: Date.now(),
      },
    });
  },

  updateMixElement: (id, updates) => {
    const { currentProject, _history } = get();
    if (!currentProject) return;
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        mixElements: (currentProject.mixElements ?? []).map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
        updatedAt: Date.now(),
      },
    });
  },

  removeMixElement: (id) => {
    const { currentProject, _history } = get();
    if (!currentProject) return;
    set({
      _history: [..._history, currentProject].slice(-MAX_HISTORY),
      _future: [],
      currentProject: {
        ...currentProject,
        mixElements: (currentProject.mixElements ?? []).filter(
          (el) => el.id !== id
        ),
        updatedAt: Date.now(),
      },
    });
  },

  // 프로젝트를 목록에 저장
  saveProject: () => {
    const { currentProject, projects } = get();
    if (!currentProject) return;
    const exists = projects.find((p) => p.id === currentProject.id);
    const updatedProjects = exists
      ? projects.map((p) => (p.id === currentProject.id ? currentProject : p))
      : [...projects, currentProject];
    set({ projects: updatedProjects });
  },

  deleteProject: (id) => {
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },
}),
  {
    name: 'doodle-projects',
    storage: createJSONStorage(() => AsyncStorage),
    // projects만 영속화 (currentProject는 세션용)
    partialize: (state) => ({ projects: state.projects }),
  },
));
