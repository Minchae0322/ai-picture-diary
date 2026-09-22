import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  children: ReactNode;
  /** 시안의 sunlight 원형 글로우. 공통 배경 레이어라 화면마다 다시 만들지 않는다(screen/README). */
  glow?: boolean;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * 모든 화면의 겉껍질. 안전영역·배경·글로우를 한 곳에서 처리한다.
 * 탭바가 있는 화면은 하단 여백을 탭바가 아니라 이 컴포넌트가 준다(expo-app-conventions 2장).
 */
export function Screen({ children, glow = true, scroll = true, refreshing, onRefresh }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + space[4],
    paddingBottom: insets.bottom + space[8],
  };

  const body = (
    <>
      {glow ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.glow, { backgroundColor: colors.primary }]}
        />
      ) : null}
      {children}
    </>
  );

  if (!scroll) {
    return (
      <View style={[styles.flex, styles.content, padding, { backgroundColor: colors.bg }]}>{body}</View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, padding]}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space[4], gap: space[6] },
  glow: {
    position: 'absolute',
    top: -240,
    right: -100,
    width: 420,
    height: 420,
    borderRadius: radius.full,
    opacity: 0.08,
  },
});
