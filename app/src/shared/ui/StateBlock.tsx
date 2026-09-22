import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/shared/api/ApiError';
import { Button } from '@/shared/ui/Button';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/**
 * 로딩 / 빈 / 에러. 시안에 없는 세 상태를 화면마다 다시 발명하지 않게 한 곳에 모은다
 * (ui-fundamentals 13장, figma-workflow 3장).
 */
export function Loading({ label = '불러오는 중' }: { label?: string }) {
  const colors = useColors();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function Empty({ message, action }: { message: string; action?: { label: string; onPress: () => void } }) {
  const colors = useColors();
  return (
    <View style={styles.block}>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      {action ? <Button label={action.label} size="medium" variant="ghost" onPress={action.onPress} /> : null}
    </View>
  );
}

export function ErrorRetry({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const colors = useColors();
  const message = error instanceof ApiError ? error.message : '잠시 후 다시 시도해 주세요.';
  return (
    <View style={styles.block}>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      <Button label="다시 시도" size="medium" variant="ghost" onPress={onRetry} />
    </View>
  );
}

/** 목록·그리드의 골격. 개수는 실제 화면과 같게 준다 - 레이아웃이 튀지 않는다. */
export function Skeleton({ height, count = 1 }: { height: number; count?: number }) {
  const colors = useColors();
  return (
    <View style={styles.skeletonWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.skeleton, { height, backgroundColor: colors.border }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingVertical: space[6] },
  block: { gap: space[3], alignItems: 'flex-start' },
  message: { fontSize: font.sm },
  skeletonWrap: { gap: space[2] },
  skeleton: { borderRadius: radius.md, opacity: 0.6 },
});
