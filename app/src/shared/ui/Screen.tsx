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
  /**
   * 하단 여백. 기본은 안전영역 + 32 로, 내용이 탭바에 붙지 않게 넉넉히 띄운다.
   *
   * <p>`tight` 는 **바닥에 붙는 주 행동이 있는 화면**을 위한 것이다(02 홈의 "오늘 그리기").
   * 그런 화면에서 기본 여백을 쓰면 버튼 아래가 100 가까이 비어 버튼이 바닥에 붙지 않는다 -
   * 사용자는 그 빈 자리를 보고 아래에 뭔가 더 있는 줄 알고 쓸어내린다.
   */
  bottomSpace?: 'default' | 'tight';
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
  bottomSpace = 'default',
  refreshing,
  onRefresh,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + space[5],
    /*
      `tight` 는 안전영역을 **더하지 않는다.** 탭바가 이미 홈 인디케이터 높이를 품고 있어서
      여기서 또 더하면 그만큼이 두 번 들어가 버튼 아래가 빈다 - 바닥에 붙여야 하는 화면에서
      그 빈자리는 "아래에 뭔가 더 있다"는 신호로 읽힌다.
    */
    paddingBottom: bottomSpace === 'tight' ? space[2] : insets.bottom + space[8],
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
 * 바탕 **세 겹**을 아래에서 위로 쌓는다 - 색, 결, 빛(`paper-background` 1장).
 * 바탕은 색이 아니라 재료다: 같은 색 한 장은 "연노랑 면"이고 결을 얹으면 "종이"다.
 *
 * <p>**모눈은 깔지 않는다**(2026-10-25). 전면 격자는 바탕을 조용하게 두지 못하고,
 * 이 체계에서 눈이 먼저 가야 하는 것은 그 위에 손으로 그린 선이다. 격자가 필요한 자리는
 * 글이 올라가는 면의 괘선뿐이고 그건 바탕이 아니라 공책이라 손으로 긋는다(`DiarySheet`).
 *
 * <p>**순서가 규칙이다.** 빛이 맨 위여야 글로우가 닿은 모서리에서 결까지 같이 하얗게 뜬다 -
 * 종이에 빛이 비치면 거친 면도 함께 날아간다.
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

      {/* 종이 결. 색만 바꾸면 그냥 면이고, 결이 있어야 종이로 읽힌다 */}
      <PaperGrain color={colors.grain} opacity={colors.grainOpacity} />

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
