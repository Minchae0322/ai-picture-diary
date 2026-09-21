import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, font, leading, radius, shadow, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_LABEL, type Weather } from '@/shared/weather';
import { Chip } from '@/shared/ui/Chip';
import { ScreenBackground, TAB_BAR_HEIGHT } from '@/shared/ui/Screen';
import { EmptyState } from '@/shared/ui/States';
import { ScreenTitle } from '@/shared/ui/Typo';
import {
  FILTER_WEATHERS,
  MOCK_FEED,
  SORT_OPTIONS,
  filterFeed,
  type FeedPost,
  type FeedSort,
} from '@/features/community/model/mockFeed';
import { FeedCard } from '@/features/community/ui/FeedCard';

/**
 * 08 커뮤니티 (시안 10:79).
 * 긴 목록이라 map이 아니라 FlatList다(expo-app-conventions 7장).
 */
export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<FeedSort>('popular');
  const [weathers, setWeathers] = useState<Weather[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_FEED);

  const visible = useMemo(() => filterFeed(posts, sort, weathers), [posts, sort, weathers]);

  // 낙관적 업데이트. 서버가 붙으면 실패 시 되돌린다(docs/screen/08-community.md 4장)
  const toggleLike = (id: string) =>
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
          : post,
      ),
    );

  const toggleWeather = (weather: Weather) =>
    setWeathers((prev) =>
      prev.includes(weather) ? prev.filter((item) => item !== weather) : [...prev, weather],
    );

  return (
    <ScreenBackground>
      <FlatList
        data={visible}
        keyExtractor={(post) => post.id}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + space[6],
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + space[16],
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenTitle>오늘의 날씨 피드</ScreenTitle>
            {/* 시안은 정렬과 날씨가 한 줄에 섞여 있다. 축이 둘이라 정렬 1개 + 날씨 다중으로 나눴다 */}
            <View style={styles.filters}>
              {SORT_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={sort === option.value}
                  onPress={() => setSort(option.value)}
                />
              ))}
              {FILTER_WEATHERS.map((weather) => (
                <Chip
                  key={weather}
                  label={WEATHER_LABEL[weather]}
                  dotColor={weatherColor[weather]}
                  selected={weathers.includes(weather)}
                  onPress={() => toggleWeather(weather)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            message="이 날씨의 기록이 아직 없어요"
            action={{ label: '필터 해제', onPress: () => setWeathers([]) }}
          />
        }
        renderItem={({ item }) => <FeedCard post={item} onToggleLike={toggleLike} />}
        ItemSeparatorComponent={() => <View style={{ height: space[4] }} />}
      />

      {/* 시안 `FAB`. 공유 작성 화면은 아직 없다(docs/screen/08-community.md 7장) */}
      <Pressable
        onPress={() => undefined}
        accessibilityRole="button"
        accessibilityLabel="오늘의 기록 공유하기"
        accessibilityHint="공유 작성 화면은 다음 라운드에 붙습니다"
        style={({ pressed }) => [
          styles.fab,
          shadow.md,
          {
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
            shadowColor: colors.primaryShadow,
            bottom: TAB_BAR_HEIGHT + insets.bottom + space[3],
          },
        ]}
      >
        <Text style={[styles.fabLabel, { color: colors.primaryFg }]}>+ 오늘 공유</Text>
      </Pressable>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 0,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  header: { gap: space[4], paddingBottom: space[5] },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  fab: {
    position: 'absolute',
    right: 20,
    height: 52,
    paddingHorizontal: space[6],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  fabLabel: { fontSize: font.md, lineHeight: leading(font.md), fontWeight: font.weightBold },
});
