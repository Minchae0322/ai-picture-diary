import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

export function Card({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <View style={[styles.card, shadow.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space[4],
    gap: space[3],
  },
});
