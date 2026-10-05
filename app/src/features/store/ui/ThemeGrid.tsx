import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { ThemeItem } from '../model/mockStore';

type Props = { themes: ThemeItem[]; onSelect: (theme: ThemeItem) => void };

/** 시안 09 `theme-grid` 2열. 적용 중인 항목은 하나만 표시된다 */
export function ThemeGrid({ themes, onSelect }: Props) {
  const colors = useColors();
  return (
    <View style={styles.grid}>
      {themes.map((theme) => (
        <Pressable
          key={theme.id}
          onPress={() => onSelect(theme)}
          accessibilityRole="button"
          accessibilityState={{ selected: theme.applied }}
          accessibilityLabel={`${theme.name}, ${theme.description}${theme.plusOnly ? ', Plus 전용' : ''}`}
          style={({ pressed }) => [
            styles.item,
            {
              backgroundColor: colors.surface,
              borderColor: theme.applied ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <LinearGradient colors={theme.preview} style={styles.preview}>
            {theme.plusOnly ? (
              <View style={[styles.lock, { backgroundColor: colors.surfaceSolid }]}>
                <Text style={[styles.lockLabel, { color: colors.text }]}>Plus</Text>
              </View>
            ) : null}
          </LinearGradient>
          <Text style={[styles.name, { color: colors.text }]}>{theme.name}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>{theme.description}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  item: {
    flexGrow: 1,
    flexBasis: 150,
    maxWidth: 180,
    gap: 6,
    padding: space[3],
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  preview: { height: 84, borderRadius: radius.md, padding: space[2], alignItems: 'flex-end' },
  lock: { paddingHorizontal: space[2], paddingVertical: 4, borderRadius: radius.full },
  lockLabel: { fontSize: font.micro, lineHeight: 13, fontFamily: font.bold },
  name: { fontSize: font.base, lineHeight: leading(font.base, 1.15), fontFamily: font.bold },
  description: { fontSize: font.xs, fontFamily: font.regular, lineHeight: leading(font.xs, 1.1) },
});
