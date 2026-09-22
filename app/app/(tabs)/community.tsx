import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Empty, ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { font, radius, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { Weather } from '@/shared/weather';
import type { PostSort, ReportReason } from '@/features/community/api/communityApi';
import { useFeed, useReportPost, useToggleLike } from '@/features/community/hooks/useCommunity';
import { useToday } from '@/features/diary/hooks/useDiary';
import { FeedFilters } from '@/features/community/ui/FeedFilters';
import { PostCard } from '@/features/community/ui/PostCard';
import { ReportSheet } from '@/features/community/ui/ReportSheet';

/**
 * 08 커뮤니티. 무한 스크롤이라 Screen(ScrollView) 대신 FlatList 가 스크롤을 갖는다 -
 * ScrollView 안에 목록을 넣으면 가상화가 죽는다(expo-app-conventions 5장).
 */
export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [sort, setSort] = useState<PostSort>('RECOMMENDED');
  const [weathers, setWeathers] = useState<Weather[]>([]);
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  const feed = useFeed(sort, weathers);
  const today = useToday();
  // 추천은 오늘 기록을 재료로 쓴다. 없으면 서버가 최신순으로 떨어뜨리므로 그 사실만 알려 준다
  const recommendUnavailable = sort === 'RECOMMENDED' && today.isSuccess && today.data === null;
  const toggleLike = useToggleLike(sort, weathers);
  const report = useReportPost();
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];

  const toggleWeather = (weather: Weather) =>
    setWeathers((current) =>
      current.includes(weather) ? current.filter((w) => w !== weather) : [...current, weather],
    );

  const submitReport = (reason: ReportReason) => {
    if (reportTarget) {
      report.mutate({ postId: reportTarget, reason });
    }
    setReportTarget(null);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space[4], paddingBottom: insets.bottom + 96 },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title="오늘의 날씨 피드" />
            <FeedFilters
              sort={sort}
              weathers={weathers}
              onChangeSort={setSort}
              onToggleWeather={toggleWeather}
            />
            {recommendUnavailable ? (
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                오늘 한 줄을 남기면 비슷한 기분의 글을 먼저 보여드려요. 지금은 최신순이에요.
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          feed.isPending ? (
            <Skeleton height={160} count={3} />
          ) : feed.isError ? (
            <ErrorRetry error={feed.error} onRetry={() => feed.refetch()} />
          ) : (
            <Empty
              message={
                weathers.length > 0 ? '이 날씨의 기록이 아직 없어요' : '아직 공유된 기록이 없어요'
              }
              action={
                weathers.length > 0
                  ? { label: '필터 해제', onPress: () => setWeathers([]) }
                  : undefined
              }
            />
          )
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={() => toggleLike.mutate({ postId: item.id, liked: item.likedByMe })}
            onReport={() => setReportTarget(item.id)}
          />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : null
        }
        refreshing={feed.isRefetching}
        onRefresh={() => feed.refetch()}
      />

      <Pressable
        onPress={() => router.push('/')}
        accessibilityRole="button"
        accessibilityLabel="오늘의 기록 공유하기"
        style={({ pressed }) => [
          styles.fab,
          shadow.md,
          {
            bottom: insets.bottom + space[6],
            backgroundColor: colors.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text style={[styles.fabLabel, { color: colors.primaryFg }]}>+ 오늘 공유</Text>
      </Pressable>

      <ReportSheet
        visible={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        onSubmit={submitReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: { paddingHorizontal: space[4], gap: space[3] },
  header: { gap: space[3], marginBottom: space[1] },
  hint: { fontSize: font.xs, lineHeight: 18 },
  footer: { paddingVertical: space[4] },
  fab: {
    position: 'absolute',
    right: space[4],
    paddingHorizontal: space[6],
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: { fontSize: font.base, fontWeight: font.weightBold },
});
