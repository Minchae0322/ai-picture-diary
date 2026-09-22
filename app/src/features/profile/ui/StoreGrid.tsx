import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/ui/Icon';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { StoreItem } from '../api/profileApi';

type Props = {
  items: StoreItem[];
  columns: 2 | 4;
  onSelect: (item: StoreItem) => void;
  pendingCode?: string;
};

/** 09 테마(2열) / 캐릭터(4열) 그리드. 적용 중 항목은 "사용 중" 라벨로 하나만 표시된다. */
export function StoreGrid({ items, columns, onSelect, pendingCode }: Props) {
  const colors = useColors();
  const width = columns === 2 ? '48%' : '23%';

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable
          key={item.code}
          onPress={() => onSelect(item)}
          accessibilityRole="button"
          accessibilityState={{ selected: item.selected, busy: pendingCode === item.code }}
          accessibilityLabel={label(item)}
          style={({ pressed }) => [
            styles.cell,
            {
              width,
              backgroundColor: colors.surface,
              borderColor: item.selected ? colors.primary : colors.border,
              borderWidth: item.selected ? 2 : 1,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={[styles.preview, { backgroundColor: colors.bg }]}>
            <Icon name={item.locked ? 'crown' : 'candy'} size={26} color={colors.primary} />
          </View>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text numberOfLines={1} style={[styles.caption, { color: colors.textMuted }]}>
            {caption(item)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function label(item: StoreItem): string {
  const state = item.selected ? ', 사용 중' : item.locked ? ', 구독 필요' : '';
  return `${item.name}${state}`;
}

function caption(item: StoreItem): string {
  if (item.selected) return '사용 중';
  return item.locked ? 'Plus' : item.description;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  cell: { gap: space[1], padding: space[2], borderRadius: radius.lg },
  preview: {
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: font.sm, fontWeight: font.weightBold },
  caption: { fontSize: font.xs },
});
