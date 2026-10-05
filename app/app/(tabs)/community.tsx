import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Backdrop } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Note } from '@/shared/ui/Type';
import { Empty, ErrorRetry, Skeleton } from '@/shared/ui/StateBlock';
import { useToast } from '@/shared/ui/Toast';
import { font, gutter, radius, space } from '@/shared/theme/tokens';
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
 * 배경·글로우만 `Backdrop` 으로 따로 깐다.
 */
export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

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
      toast('신고했어요. 검토 후 숨겨집니다');
    }
    setReportTarget(null);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bgTop }]}>
      <Backdrop />

      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space[5], paddingBottom: insets.bottom + 96 },
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
              <Note>
                오늘 한 줄을 남기면 비슷한 기분의 글을 먼저 보여드려요. 지금은 최신순이에요.
              </Note>
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
            onNotReady={(name) => toast(`${name} 화면은 다음 라운드에 붙습니다`)}
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

      {/* prototype `.fab`. 공유 작성 화면이 아직 없어 오늘의 기록(02/04)으로 보낸다 */}
      <Pressable
        onPress={() => router.push('/')}
        accessibilityRole="button"
        accessibilityLabel="오늘의 기록 공유하기"
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: insets.bottom + space[6],
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
            shadowColor: colors.primaryShadow,
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
  content: { paddingHorizontal: gutter.narrow, gap: space[6] },
  header: { gap: space[6] },
  footer: { paddingVertical: space[4] },
  fab: {
    position: 'absolute',
    right: gutter.narrow,
    paddingHorizontal: space[6],
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabLabel: { fontSize: font.md, fontFamily: font.bold },
});
