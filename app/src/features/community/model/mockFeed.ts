import type { Weather } from '@/shared/weather';

/**
 * 커뮤니티 피드. **목 데이터다.**
 *
 * 커뮤니티 도메인이 아직 없다(프로젝트 스킬 8장).
 * 붙는 자리: `GET /api/v1/posts?sort=&weather=&cursor=` (커서 페이징. 오프셋 쓰지 않는다).
 * 공유가 일기의 복사인지 참조인지는 미정이다(docs/screen/08-community.md 6장).
 */
export type FeedPost = {
  id: string;
  author: string;
  authorEmoji: string;
  relativeTime: string;
  weather: Weather;
  content: string;
  likes: number;
  comments: number;
  liked: boolean;
};

export type FeedSort = 'popular' | 'recent';

export const SORT_OPTIONS: readonly { value: FeedSort; label: string }[] = [
  { value: 'popular', label: '인기' },
  { value: 'recent', label: '최신' },
];

/** 시안 `filters`의 날씨 두 개. 실제로는 서버가 주는 목록을 쓴다 */
export const FILTER_WEATHERS: Weather[] = ['SUNNY', 'RAIN'];

export const MOCK_FEED: FeedPost[] = [
  {
    id: 'p1',
    author: '복숭아젤리',
    authorEmoji: '🍑',
    relativeTime: '2시간 전',
    weather: 'RAIN',
    content: '비 오는 날 창가에서 커피 한 잔',
    likes: 128,
    comments: 14,
    liked: false,
  },
  {
    id: 'p2',
    author: '해바라기',
    authorEmoji: '🌻',
    relativeTime: '5시간 전',
    weather: 'SUNNY',
    content: '드디어 이직 합격! 오늘은 무조건 맑음',
    likes: 342,
    comments: 56,
    liked: true,
  },
  {
    id: 'p3',
    author: '밤하늘',
    authorEmoji: '🌙',
    relativeTime: '어제',
    weather: 'CLOUDY',
    content: '아무것도 안 한 날. 그래도 괜찮아',
    likes: 87,
    comments: 9,
    liked: false,
  },
];

/**
 * 정렬 1개 + 날씨 다중. 시안은 한 줄에 섞여 있지만 축이 둘이다
 * (docs/screen/08-community.md 4장).
 */
export function filterFeed(posts: FeedPost[], sort: FeedSort, weathers: Weather[]): FeedPost[] {
  const filtered = weathers.length === 0 ? posts : posts.filter((post) => weathers.includes(post.weather));
  return sort === 'popular' ? [...filtered].sort((a, b) => b.likes - a.likes) : filtered;
}
