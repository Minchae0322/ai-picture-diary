import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PaperGrain } from '@/shared/ui/PaperGrain';
import { CONTENT_MAX_WIDTH, gutter, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  children: ReactNode;
  /** prototype `.pad`(28) 와 `.pad.g20`(20). 카드가 폭을 꽉 쓰는 화면은 narrow */
  width?: keyof typeof gutter;
  /** 우상단 햇살 글로우. 01 처럼 자체 배경이 있는 화면만 끈다 */
  glow?: boolean;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * 모든 화면의 겉껍질. 안전영역·배경·글로우를 한 곳에서 처리한다.
 * 탭바가 있는 화면은 하단 여백을 탭바가 아니라 이 컴포넌트가 준다(expo-app-conventions 2장).
 */
export function Screen({
  children,
  width = 'wide',
  glow = true,
  scroll = true,
  refreshing,
  onRefresh,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + space[5],
    paddingBottom: insets.bottom + space[8],
    paddingHorizontal: gutter[width],
  };

  const content = (
    <View style={[styles.column, padding]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.bgTop }]}>
      <Backdrop glow={glow} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.grow}
          /*
            키보드가 올라온 화면에서 세 가지가 깨진다. 셋 다 여기서 막는다 -
            글을 받는 화면(02)이 생기면서 셋 다 실제로 걸렸다.

            1. `automaticallyAdjustKeyboardInsets` 없으면 키보드가 입력창을 덮고 끝이다.
               쓰는 중에 내가 쓴 글이 안 보인다
            2. `keyboardShouldPersistTaps` 없으면 키보드가 떠 있을 때의 **첫 탭이 먹힌다** -
               감정 칩이나 "오늘 그리기"를 누르면 키보드만 닫히고 아무 일도 안 일어난다.
               사용자는 버튼이 고장 났다고 읽는다
            3. 손가락으로 쓸어내려 닫는 것(`interactive`)은 iOS 사용자가 몸으로 아는 동작이다
          */
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

/**
 * prototype `.phone` 의 세로 그라디언트 + `::before` 의 원형 글로우 + **종이 결**.
 * 라이트에서는 위아래가 아주 조금 갈려 종이 한 장을 비스듬히 본 느낌을 낸다.
 */
export function Backdrop({ glow = true }: { glow?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.bgTop} />
            <Stop offset="0.55" stopColor={colors.bgBottom} />
            <Stop offset="1" stopColor={colors.bgBottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sky)" />
      </Svg>

      {/* 종이 결. 색만 바꾸면 그냥 노란 면이고, 결이 있어야 종이로 읽힌다 */}
      <PaperGrain color={colors.grain} />

      {glow ? (
        <Svg width={GLOW} height={GLOW} style={styles.glow}>
          <Defs>
            <RadialGradient id="sunlight" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.glow} stopOpacity={colors.glowOpacity} />
              <Stop offset="0.7" stopColor={colors.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#sunlight)" />
        </Svg>
      ) : null}
    </View>
  );
}

/** prototype `.phone::before` 와 같은 크기·위치 */
const GLOW = 420;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  column: {
    flexGrow: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    gap: space[6],
  },
  glow: { position: 'absolute', top: -160, right: -170 },
});
