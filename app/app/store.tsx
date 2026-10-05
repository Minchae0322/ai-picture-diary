import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { font, leading, radius, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { BackLink } from '@/shared/ui/BackLink';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { Screen } from '@/shared/ui/Screen';
import { EmptyState } from '@/shared/ui/States';
import { ScreenTitle, SectionTitle } from '@/shared/ui/Typo';
import {
  MOCK_CHARACTERS,
  MOCK_THEMES,
  STORE_CATEGORIES,
  UNDECIDED_CATEGORIES,
  type StoreCategory,
  type ThemeItem,
} from '@/features/store/model/mockStore';
import { ThemeGrid } from '@/features/store/ui/ThemeGrid';

/** 09 테마 · 캐릭터 상점 (시안 11:2). 탭이 아니라 10 마이페이지에서 밀어 올린다 */
export default function StoreScreen() {
  const colors = useColors();
  const [category, setCategory] = useState<StoreCategory>('theme');

  const onSelectTheme = (theme: ThemeItem) => {
    if (theme.plusOnly) {
      // 구독 결제 화면이 아직 없다(docs/screen/09-store.md 7장)
      Alert.alert('Jelly Plus 전용', `${theme.name} 테마는 구독하면 쓸 수 있어요.`);
      return;
    }
    Alert.alert(theme.name, '테마 적용은 다음 라운드에 붙습니다.');
  };

  return (
    <Screen hasTabBar={false}>
      <View style={styles.header}>
        <BackLink />
        <ScreenTitle>꾸미기</ScreenTitle>
      </View>

      {/* 시안 `premium-banner` */}
      <LinearGradient
        colors={[colors.primary, colors.accentSoft] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, shadow.md, { shadowColor: colors.primaryShadow }]}
      >
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: colors.primaryFg }]}>Jelly Plus</Text>
          <Text style={[styles.bannerBody, { color: colors.primaryFg }]}>
            모든 테마 · 캐릭터 · 무제한 다시 그리기
          </Text>
        </View>
        <Button
          label="구독"
          size="medium"
          variant="soft"
          onPress={() => Alert.alert('구독', '결제 화면은 다음 라운드에 붙습니다.')}
        />
      </LinearGradient>

      <View style={styles.tabs}>
        {STORE_CATEGORIES.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={category === option.value}
            onPress={() => setCategory(option.value)}
          />
        ))}
      </View>

      {category === 'theme' ? (
        <ThemeGrid themes={MOCK_THEMES} onSelect={onSelectTheme} />
      ) : category === 'character' ? (
        <CharacterRow />
      ) : (
        <EmptyState
          message={`${
            STORE_CATEGORIES.find((option) => option.value === category)?.label
          } 목록은 시안에 없어 아직 정하지 않았습니다.`}
        />
      )}

      {category === 'theme' ? (
        <View style={styles.section}>
          <SectionTitle>캐릭터</SectionTitle>
          <CharacterRow />
        </View>
      ) : null}

      {/* 구독 복원은 시안에 없지만 iOS 심사에 필수다(docs/screen/09-store.md 5장) */}
      <Button
        label="구매 복원"
        size="medium"
        variant="ghost"
        onPress={() => Alert.alert('구매 복원', '영수증 검증은 서버가 맡습니다. 다음 라운드.')}
      />

      {UNDECIDED_CATEGORIES.length === 0 ? null : (
        <Text style={[styles.note, { color: colors.textSubtle }]}>
          배경·폰트 카테고리는 시안에 내용이 없습니다.
        </Text>
      )}
    </Screen>
  );
}

/** 시안 `characters` 4칸. 보유하지 않은 캐릭터는 자물쇠 */
function CharacterRow() {
  const colors = useColors();
  return (
    <View style={styles.characters}>
      {MOCK_CHARACTERS.map((character) => (
        <Pressable
          key={character.id}
          onPress={() =>
            Alert.alert(
              character.name,
              character.owned ? '적용은 다음 라운드에 붙습니다.' : 'Jelly Plus로 열 수 있어요.',
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`${character.name}${character.owned ? ', 보유함' : ', 잠김'}`}
          style={({ pressed }) => [styles.character, { opacity: pressed ? 0.6 : 1 }]}
        >
          <View
            style={[
              styles.characterDot,
              character.owned
                ? { backgroundColor: character.tint }
                : { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong },
            ]}
          >
            {character.owned ? null : (
              <Text style={styles.lockGlyph} accessibilityElementsHidden importantForAccessibility="no">
                🔒
              </Text>
            )}
          </View>
          <Text numberOfLines={1} style={[styles.characterName, { color: colors.textMuted }]}>
            {character.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: space[2] },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    padding: space[5],
    borderRadius: radius.lg,
  },
  bannerText: { flex: 1, gap: space[1] },
  bannerTitle: { fontSize: font.xxl, lineHeight: leading(font.xxl, 1.1), fontFamily: font.black },
  bannerBody: { fontSize: font.sm, fontFamily: font.regular, lineHeight: leading(font.sm) },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  section: { gap: space[3] },
  characters: { flexDirection: 'row', gap: space[3] },
  character: { flex: 1, alignItems: 'center', gap: space[2] },
  characterDot: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockGlyph: { fontSize: 14, fontFamily: font.regular, lineHeight: 18 },
  characterName: { fontSize: font.xs, fontFamily: font.regular, lineHeight: leading(font.xs, 1.1) },
  note: { fontSize: font.xs, fontFamily: font.regular, lineHeight: leading(font.xs) },
});
