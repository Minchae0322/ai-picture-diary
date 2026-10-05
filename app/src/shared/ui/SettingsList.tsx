import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

export type SettingsRow = {
  icon: IconName;
  label: string;
  /** 현재값. 없으면 "설정 안 함" - 행을 숨기지 않는다(10 화면 문서 4장) */
  value?: string;
  danger?: boolean;
  onPress?: () => void;
};

/**
 * prototype.html `.settings`. 10 설정 목록은 **한 덩어리 면**이고 행 사이는 1px 선이다.
 * 행마다 카드를 주면 목록이 아니라 카드 더미로 읽힌다.
 */
export function SettingsList({ rows }: { rows: SettingsRow[] }) {
  const colors = useColors();
  return (
    <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {rows.map((row, index) => (
        <Row key={row.label} row={row} first={index === 0} />
      ))}
    </View>
  );
}

function Row({ row, first }: { row: SettingsRow; first: boolean }) {
  const colors = useColors();
  const value = row.value ?? '설정 안 함';
  const tint = row.danger ? colors.danger : colors.text;

  // 아이콘은 라벨과 같은 뜻이라 스크린리더에서 숨긴다(Icon 에 label 을 주지 않는다)
  const body = (
    <>
      <Icon name={row.icon} size={20} color={row.danger ? colors.danger : colors.textMuted} />
      <Text style={[styles.label, { color: tint }]}>{row.label}</Text>
      <Text style={[styles.value, { color: colors.textMuted }]}>{value ? `${value} ›` : '›'}</Text>
    </>
  );

  const frame = [
    styles.row,
    !first && { borderTopWidth: 1, borderTopColor: colors.border },
  ];

  if (!row.onPress) {
    return (
      <View accessible accessibilityLabel={`${row.label}, ${value}`} style={frame}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={row.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${row.label}, ${value}`}
      style={({ pressed }) => [...frame, pressed && { backgroundColor: colors.skeleton }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[5],
  },
  label: { flex: 1, fontSize: font.md, fontFamily: font.medium },
  value: { fontSize: font.base, fontFamily: font.regular },
});
