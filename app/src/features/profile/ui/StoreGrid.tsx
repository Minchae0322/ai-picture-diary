import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GradientFill } from '@/shared/ui/Gradient';
import { Icon } from '@/shared/ui/Icon';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import { WEATHERS } from '@/shared/weather';
import type { StoreItem } from '../api/profileApi';

type Props = {
  items: StoreItem[];
  columns: 2 | 4;
  onSelect: (item: StoreItem) => void;
  pendingCode?: string;
};

/**
 * 09 테마(2열, prototype `.themes`) / 캐릭터(4열, `.chars`) 그리드.
 *
 * 미리보기 색은 서버가 주지 않아 **항목 순서로 날씨 6색을 돌려 쓴다**. 테마 고유의 색은
 * 테마를 실제로 적용하는 라운드에 서버 마스터 데이터로 내려받는다(09 화면 문서 7장).
 */
export function StoreGrid({ items, columns, onSelect, pendingCode }: Props) {
  const colors = useColors();
  const weatherColors = useWeatherColors();
  const theme = columns === 2;

  return (
    <View style={styles.grid}>
      {items.map((item, index) => {
        const tint = weatherColors[WEATHERS[index % WEATHERS.length]];
        const busy = pendingCode === item.code;

        return (
          <Pressable
            key={item.code}
            onPress={() => onSelect(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: item.selected, busy }}
            accessibilityLabel={label(item)}
            style={({ pressed }) => [
              theme ? styles.themeCell : styles.charCell,
              theme && {
                backgroundColor: colors.surface,
                borderColor: item.selected ? colors.primary : colors.border,
              },
              { opacity: pressed || busy ? 0.7 : 1 },
            ]}
          >
            {theme ? (
              <View style={styles.preview}>
                <GradientFill from={colors.surfaceSolid} to={tint} />
                {item.locked ? (
                  <View style={[styles.plus, { backgroundColor: colors.surfaceSolid }]}>
                    <Text style={[styles.plusText, { color: colors.text }]}>Plus</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View
                style={[
                  styles.char,
                  item.locked
                    ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong }
                    : { backgroundColor: tint },
                ]}
              >
                {item.locked ? <Icon name="lock" size={16} color={colors.decor} /> : null}
              </View>
            )}

            <Text
              numberOfLines={1}
              style={[
                theme ? styles.themeName : styles.charName,
                { color: theme ? colors.text : colors.textMuted },
              ]}
            >
              {item.name}
            </Text>
            {theme ? (
              <Text numberOfLines={1} style={[styles.caption, { color: colors.textMuted }]}>
                {caption(item)}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function label(item: StoreItem): string {
  const state = item.selected ? ', 사용 중' : item.locked ? ', 구독 필요' : '';
  return `${item.name}${state}`;
}

function caption(item: StoreItem): string {
  if (item.selected) {
    return '사용 중';
  }
  return item.locked ? 'Jelly Plus 전용' : item.description;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] + 2 },
  themeCell: {
    width: '47%',
    flexGrow: 1,
    gap: 6,
    padding: space[3],
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  charCell: { flexBasis: '20%', flexGrow: 1, alignItems: 'center', gap: space[2] },
  preview: {
    height: 84,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'flex-end',
    padding: space[2],
  },
  plus: { paddingHorizontal: space[2], paddingVertical: space[1], borderRadius: radius.full },
  plusText: { fontSize: font.micro, fontFamily: font.bold },
  char: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: { fontSize: font.base, fontFamily: font.bold },
  charName: { fontSize: font.xs, fontFamily: font.regular },
  caption: { fontSize: font.xs, fontFamily: font.regular },
});
