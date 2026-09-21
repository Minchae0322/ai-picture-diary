import type { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sunlight from '@assets/figma/sunlight.svg';
import { CONTENT_MAX_WIDTH, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 탭바가 화면 위에 떠 있어(position: absolute) 스크롤 내용이 그만큼 더 내려가야 한다 */
export const TAB_BAR_HEIGHT = 66;

/**
 * 모든 화면의 배경. 세로 그라디언트 + 상단 우측 원형 글로우 한 장.
 * 시안의 `sunlight` 레이어는 공통 배경이라 화면마다 다시 만들지 않는다(docs/screen/README.md).
 */
export function ScreenBackground({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.bgGradient}
        locations={colors.bgGradientStops}
        style={StyleSheet.absoluteFill}
      />
      {/* 시안 좌표: x=140, y=-160, 420x420. 폭이 넓어져도 오른쪽 위에 붙는다 */}
      <View
        style={styles.glow}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Sunlight />
      </View>
      {children}
    </View>
  );
}

type Props = {
  children: ReactNode;
  /** 시안 기본 여백 28. 카드가 가장자리까지 가는 화면(05·06·08·10)은 20 */
  gutter?: 20 | 28;
  /** 탭바가 있는 화면만. 01처럼 탭바가 없으면 false */
  hasTabBar?: boolean;
  refreshControl?: ReactElement;
};

/**
 * 배경 + 세로 스크롤 + 안전영역을 한 번에.
 * 인셋은 컨테이너가 아니라 내용(contentContainerStyle)에 준다(expo-app-conventions 1장).
 */
export function Screen({ children, gutter = 28, hasTabBar = true, refreshControl }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      {/* 입력창이 있는 화면을 위해 기본으로 깐다. iOS만 padding, Android는 없음이 기본 */}
      <KeyboardAvoidingView
        style={styles.scroll}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: gutter,
              paddingTop: insets.top + space[6],
              paddingBottom: (hasTabBar ? TAB_BAR_HEIGHT + insets.bottom : insets.bottom) + space[8],
            },
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: { position: 'absolute', right: -170, top: -160, width: 420, height: 420 },
  scroll: { flex: 1 },
  content: { alignItems: 'center' },
  /** 태블릿·폴더블에서 한 줄이 화면을 가로지르지 않게 본문 폭을 묶는다 */
  inner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, gap: space[6] },
});
