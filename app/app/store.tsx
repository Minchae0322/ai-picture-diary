import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError } from '@/shared/api/ApiError';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { GradientFill } from '@/shared/ui/Gradient';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Label, Muted } from '@/shared/ui/Type';
import { ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { useToast } from '@/shared/ui/Toast';
import { font, radius, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { StoreCategory, StoreItem } from '@/features/profile/api/profileApi';
import { useSelectItem, useStoreItems } from '@/features/profile/hooks/useProfile';
import { StoreGrid } from '@/features/profile/ui/StoreGrid';

/**
 * 09 꾸미기. 시안의 카테고리 탭 4개 중 배경·폰트는 항목이 없어 **칩을 눌러도 빈 안내만** 나온다
 * (09 화면 문서 5장에서 "탭을 숨긴다"로 정했지만, prototype 이 네 칩을 모두 두고 빈 설명을
 * 보여주므로 그쪽을 따랐다 - 앞으로 무엇이 생기는지가 보이는 편이 낫다).
 */
const CATEGORIES: { value: StoreCategory | 'BACKGROUND' | 'FONT'; label: string }[] = [
  { value: 'THEME', label: '테마' },
  { value: 'CHARACTER', label: '캐릭터' },
  { value: 'BACKGROUND', label: '배경' },
  { value: 'FONT', label: '폰트' },
];

export default function StoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();
  const items = useStoreItems();
  const select = useSelectItem();
  const [pendingCode, setPendingCode] = useState<string>();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('THEME');

  const onSelect = (item: StoreItem) => {
    if (item.locked) {
      // 구독 유도. 결제 흐름은 아직 없다(09 화면 문서 7장)
      toast(`${item.name}은 Jelly Plus 로 열 수 있어요`);
      return;
    }
    setPendingCode(item.code);
    select.mutate(item.code, {
      onError: (error) =>
        toast(error instanceof ApiError ? error.message : '적용하지 못했어요. 다시 시도해 주세요'),
      onSettled: () => setPendingCode(undefined),
    });
  };

  const themes = items.data?.filter((item) => item.category === 'THEME') ?? [];
  const characters = items.data?.filter((item) => item.category === 'CHARACTER') ?? [];

  return (
    <Screen>
      <ScreenHeader title="꾸미기" onBack={() => router.back()} />

      {/* prototype `.banner` - 브랜드색에서 악센트로 흐르는 띠. 카드가 아니라 광고 자리다.
          바깥이 그림자, 안쪽이 자르기를 맡는다 - iOS 는 둘을 한 View 에 주면 그림자가 잘린다 */}
      <View style={[shadow.md, styles.bannerShadow, { backgroundColor: colors.primary }]}>
        <View style={styles.banner}>
          <GradientFill from={colors.primary} to={colors.accentSoft} />
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
            onPress={() => toast('구독 결제 화면은 다음 라운드에 붙습니다')}
          />
        </View>
      </View>

      <View style={styles.chips}>
        {CATEGORIES.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={category === option.value}
            onPress={() => setCategory(option.value)}
          />
        ))}
      </View>

      {items.isError ? (
        <ErrorRetry error={items.error} onRetry={() => items.refetch()} />
      ) : !items.data ? (
        <Skeleton height={140} count={2} />
      ) : category === 'THEME' ? (
        <>
          <StoreGrid items={themes} columns={2} onSelect={onSelect} pendingCode={pendingCode} />
          <View style={styles.section}>
            <Label>캐릭터</Label>
            <StoreGrid
              items={characters}
              columns={4}
              onSelect={onSelect}
              pendingCode={pendingCode}
            />
          </View>
        </>
      ) : category === 'CHARACTER' ? (
        <StoreGrid items={characters} columns={4} onSelect={onSelect} pendingCode={pendingCode} />
      ) : (
        <Muted>
          {CATEGORIES.find((option) => option.value === category)?.label} 목록은 시안에 없어 아직
          정하지 않았습니다.
        </Muted>
      )}

      {/* 스토어 심사 필수 항목. 복원 처리는 결제가 붙는 라운드에 함께 온다(app-store-release) */}
      <Button
        label="구매 복원"
        size="medium"
        variant="ghost"
        onPress={() => toast('구매 복원은 결제와 함께 붙습니다')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerShadow: { borderRadius: radius.lg },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    padding: space[5],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  bannerText: { flex: 1, gap: space[1] },
  bannerTitle: { fontSize: font.xxl, fontFamily: font.black },
  bannerBody: { fontSize: font.sm, fontFamily: font.regular, opacity: 0.92 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  section: { gap: space[3] },
});
