import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, leading, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Card } from '@/shared/ui/Card';

export type SettingRow = {
  id: string;
  /** 시안은 이모지를 라벨 앞에 둔다. 스크린리더에는 읽히지 않게 분리한다 */
  glyph: string;
  label: string;
  /** 현재값. 없으면 "설정 안 함"(docs/screen/10-mypage.md 4장) */
  value?: string;
  onPress: () => void;
  destructive?: boolean;
};

/** 시안 10 `settings` 6행 + 구분선 */
export function SettingsList({ rows }: { rows: SettingRow[] }) {
  const colors = useColors();
  return (
    <Card size="lg" flat style={styles.card}>
      {rows.map((row, index) => (
        <Fragment key={row.id}>
          {index === 0 ? null : <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          <Pressable
            onPress={row.onPress}
            accessibilityRole="button"
            accessibilityLabel={row.label}
            accessibilityValue={{ text: row.value ?? '설정 안 함' }}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text
              style={styles.glyph}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {row.glyph}
            </Text>
            <Text
              style={[styles.label, { color: row.destructive === true ? colors.danger : colors.text }]}
            >
              {row.label}
            </Text>
            <Text numberOfLines={1} style={[styles.value, { color: colors.textMuted }]}>
              {row.value ?? '설정 안 함'} ›
            </Text>
          </Pressable>
        </Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 0, paddingHorizontal: 0, gap: 0 },
  divider: { height: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: Math.max(56, MIN_TOUCH_TARGET),
    paddingHorizontal: space[5],
  },
  glyph: { fontSize: 16, lineHeight: 20 },
  label: { flex: 1, fontSize: font.md, lineHeight: leading(font.md), fontWeight: font.weightMedium },
  value: { maxWidth: 140, fontSize: font.base, lineHeight: leading(font.base) },
});
