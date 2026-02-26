# CLAUDE.md - Doodle Wallpaper Studio

## 프로젝트 개요
손그림(Neubrutalism) 스타일 배경화면 제작 모바일 앱.
사용자가 위젯 타입을 선택하고 캔버스에서 꾸며서 배경화면으로 저장한다.

## 기술 스택
- **Framework**: React Native + Expo (Expo Router)
- **Styling**: NativeWind (Tailwind CSS)
- **State**: Zustand
- **Icons**: lucide-react-native
- **Animation**: react-native-reanimated
- **Gesture**: react-native-gesture-handler

## 디렉토리 구조
```
src/
  components/
    common/       # 공통 UI (DoodleCard, DoodleButton 등 Neubrutalism 컴포넌트)
    home/         # Home 화면 전용 컴포넌트
    editor/       # Editor 캔버스 관련 컴포넌트
    type-select/  # 위젯 타입 선택 관련 컴포넌트
  screens/        # 화면 단위 컴포넌트 (Expo Router pages)
  navigation/     # 네비게이션 설정
  hooks/          # 커스텀 훅
  utils/          # 유틸리티 함수
  constants/      # 색상, 스타일, 위젯 타입 등 상수
  assets/         # 폰트, 이미지, 스티커 에셋
docs/
  PRD.md          # 제품 요구사항 문서
```

## 디자인 규칙

### Neubrutalism 공통 스타일
모든 카드/버튼에 적용되는 기본 스타일:
- border: 3px solid #1A1A1A
- borderRadius: 비대칭 (삐뚤빼뚤한 손그림 느낌)
- boxShadow: 4px 4px 0px #1A1A1A
- 누를 때: shadow 줄이고 translate-y 1px (쫀득한 피드백)

### 색상 팔레트
- 배경: #FFFDF9
- 포인트: #FFDE59 (노란)
- 블록 파랑: #91D0FF, #E6F3FF
- 블록 핑크: #FF91AD, #FFF0F5
- 테두리/그림자: #1A1A1A

### 폰트
- 기본: Gaegu (Google Fonts, 400/700)

## 코딩 컨벤션
- 컴포넌트: 함수형 + TypeScript
- 파일명: PascalCase (컴포넌트), camelCase (유틸/훅)
- 스타일: NativeWind className 우선, 복잡한 스타일만 StyleSheet
- 상태: 로컬 → useState, 전역 → Zustand store
- 한국어 주석 사용

## 주요 참고 파일
- `docs/PRD.md`: 상세 제품 요구사항
- `기획안.txt`: 원본 Figma 와이어프레임 명세
- `디자인목업.html`, `디자인목업2.html`: React 기반 디자인 목업 (참고용)

## 빌드 & 실행
```bash
npx expo start          # 개발 서버 실행
npx expo start --ios    # iOS 시뮬레이터
npx expo start --android # Android 에뮬레이터
```
