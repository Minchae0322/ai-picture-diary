import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/ui/Icon';
import { useRouter } from 'expo-router';
import { ApiError } from '@/shared/api/ApiError';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { StoreItem } from '@/features/profile/api/profileApi';
import { useSelectItem, useStoreItems } from '@/features/profile/hooks/useProfile';
import { StoreGrid } from '@/features/profile/ui/StoreGrid';

/**
 * 09 꾸미기. 시안의 카테고리 탭 4개 중 배경·폰트는 항목이 없어 탭 자체를 노출하지 않는다
 * (09 화면 문서 5장: 항목 0개면 탭을 숨긴다).
 */
export default function StoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const items = useStoreItems();
  const select = useSelectItem();
  const [pendingCode, setPendingCode] = useState<string>();

  const onSelect = (item: StoreItem) => {
    if (item.locked) {
      // 구독 유도. 결제 흐름은 아직 없다(09 화면 문서 7장)
      Alert.alert('Jelly Plus', `${item.name}은 구독하면 쓸 수 있어요.`);
      return;
    }
    setPendingCode(item.code);
    select.mutate(item.code, {
      onError: (error) =>
        Alert.alert('적용하지 못했어요', error instanceof ApiError ? error.message : '다시 시도해 주세요.'),
      onSettled: () => setPendingCode(undefined),
    });
  };

  const themes = items.data?.filter((item) => item.category === 'THEME') ?? [];
  const characters = items.data?.filter((item) => item.category === 'CHARACTER') ?? [];

  return (
    <Screen>
      <ScreenHeader title="꾸미기" onBack={() => router.back()} />

      <Card>
        <View style={styles.bannerHead}>
          <Icon name="crown" size={18} color={colors.primary} />
          <Text style={[styles.bannerTitle, { color: colors.text }]}>Jelly Plus</Text>
        </View>
        <Text style={[styles.bannerBody, { color: colors.textMuted }]}>
          모든 테마 · 캐릭터 · 무제한 다시 그리기
        </Text>
        <Button
          label="구독"
          size="medium"
          onPress={() => Alert.alert('Jelly Plus', '결제는 아직 준비 중이에요.')}
        />
      </Card>

      {items.isError ? (
        <ErrorRetry error={items.error} onRetry={() => items.refetch()} />
      ) : !items.data ? (
        <Skeleton height={140} count={2} />
      ) : (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>테마</Text>
            <StoreGrid items={themes} columns={2} onSelect={onSelect} pendingCode={pendingCode} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>캐릭터</Text>
            <StoreGrid items={characters} columns={4} onSelect={onSelect} pendingCode={pendingCode} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  bannerTitle: { fontSize: font.base, fontWeight: font.weightBold },
  bannerBody: { fontSize: font.sm },
  section: { gap: space[3] },
  sectionTitle: { fontSize: font.base, fontWeight: font.weightBold },
});
