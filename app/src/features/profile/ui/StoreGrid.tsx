import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GradientFill } from '@/shared/ui/Gradient';
import { Icon } from '@/shared/ui/Icon';
import { SketchBorder } from '@/shared/ui/SketchBorder';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors, useEmotionColors } from '@/shared/theme/useColors';
import { EMOTIONS } from '@/shared/emotion';
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
 * 미리보기 색은 서버가 주지 않는다. 전에는 **항목 순서로 감정 9색을 돌려 썼는데**, 그러면
 * "Mint Soda" 아래 빨강이 깔리는 식으로 이름과 색이 어긋난다 - 고르는 화면에서 미리보기가
 * 거짓말을 하면 미리보기가 아니다. 이름이 색을 말하는 네 테마만 여기서 짝지어 둔다.
 *
 * 테마를 실제로 적용하는 라운드에 서버 마스터 데이터가 이 표를 가져간다(09 화면 문서 7장).
 */
const THEME_PREVIEW: Record<string, string> = {
  JELLY: '#3f6d8e',
  NIGHT_JELLY: '#1c2831',
  MINT_SODA: '#8fbfae',
  LAVENDER: '#a99ac7',
};
export function StoreGrid({ items, columns, onSelect, pendingCode }: Props) {
  const colors = useColors();
  const emotionColors = useEmotionColors();
  const theme = columns === 2;

  return (
    <View style={styles.grid}>
      {items.map((item, index) => {
        const tint = THEME_PREVIEW[item.code] ?? emotionColors[EMOTIONS[index % EMOTIONS.length]];
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
              theme && { backgroundColor: colors.surface },
              { opacity: pressed || busy ? 0.7 : 1 },
            ]}
          >
            {theme ? (
              <>
              <SketchBorder
                radius={18}
                color={item.selected ? colors.primary : colors.border}
                strokeWidth={item.selected ? 2 : 1.5}
                seed={index * 23 + 9}
              />
              <View style={styles.preview}>
                <GradientFill from={colors.surfaceSolid} to={tint} />
                {item.locked ? (
                  <View style={[styles.plus, { backgroundColor: colors.surfaceSolid }]}>
                    <Text style={[styles.plusText, { color: colors.text }]}>Plus</Text>
                  </View>
                ) : null}
              </View>
              </>
            ) : (
              <View
                style={[
                  styles.char,
                  item.locked
                    ? { backgroundColor: colors.skeleton, borderWidth: 1.5, borderColor: colors.border }
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
