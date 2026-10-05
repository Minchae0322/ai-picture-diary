import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
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
 * prototype `.phone` 의 세로 그라디언트 + `::before` 의 원형 글로우.
 * 라이트에서는 세 정지점이 모두 바닐라라 단색으로 보이고, 다크에서만 위아래가 갈린다.
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
