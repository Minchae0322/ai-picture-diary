import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { ApiError } from '@/shared/api/ApiError';
import { Button } from './Button';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/**
 * 로딩 / 빈 / 에러 세 가지는 시안에 없다. 화면마다 다시 만들지 않고 여기서 한 모양으로 쓴다
 * (figma-workflow 3장 "시안에 없는 것").
 */

export function Skeleton({ height, width = '100%' }: { height: number; width?: DimensionValue }) {
  const colors = useColors();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ height, width, borderRadius: radius.md, backgroundColor: colors.skeleton }}
    />
  );
}

export function EmptyState({ message, action }: { message: string; action?: { label: string; onPress: () => void } }) {
  const colors = useColors();
  return (
    <View style={styles.block}>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      {action === undefined ? null : (
        <Button label={action.label} size="medium" variant="soft" onPress={action.onPress} />
      )}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const colors = useColors();
  // 문자열 매칭이 아니라 타입으로 분기한다(ApiError 주석)
  const message = error instanceof ApiError ? error.message : '잠시 후 다시 시도해 주세요.';
  return (
    <View style={styles.block}>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      <Button label="다시 시도" size="medium" variant="soft" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignItems: 'flex-start', gap: space[3], paddingVertical: space[2] },
  message: { fontSize: font.base, lineHeight: leading(font.base) },
});
