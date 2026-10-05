import type { Gradient } from '@/shared/theme/tokens';

/**
 * 테마·캐릭터 상품. **목 데이터다.**
 *
 * 상품 마스터와 구독 상태 도메인이 아직 없다(프로젝트 스킬 8장).
 * 붙는 자리: `GET /api/v1/store/items` (무료/Plus 구분, 프리뷰) + 영수증 검증 결과로 판단하는 구독 상태.
 * **클라이언트 플래그를 신뢰하지 않는다**(docs/screen/09-store.md 6장).
 */
export type StoreCategory = 'theme' | 'character' | 'background' | 'font';

export const STORE_CATEGORIES: readonly { value: StoreCategory; label: string }[] = [
  { value: 'theme', label: '테마' },
  { value: 'character', label: '캐릭터' },
  { value: 'background', label: '배경' },
  { value: 'font', label: '폰트' },
];

export type ThemeItem = {
  id: string;
  name: string;
  description: string;
  preview: Gradient;
  /** Plus 전용인가 */
  plusOnly: boolean;
  applied: boolean;
};

export const MOCK_THEMES: ThemeItem[] = [
  {
    id: 'paper',
    name: 'Paper',
    description: '기본 · 사용 중',
    preview: ['#faf4dc', '#ece3c2'],
    plusOnly: false,
    applied: true,
  },
  {
    id: 'night-jelly',
    name: 'Night Jelly',
    description: '밤의 젤리',
    preview: ['#18242d', '#2f4356'],
    plusOnly: true,
    applied: false,
  },
  {
    id: 'mint-soda',
    name: 'Mint Soda',
    description: '청량한 민트',
    preview: ['#f2fbf8', '#8fbfae'],
    plusOnly: false,
    applied: false,
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: '라벤더 드림',
    preview: ['#f5f2fb', '#a99ac7'],
    plusOnly: true,
    applied: false,
  },
];

export type CharacterItem = { id: string; name: string; tint: string; owned: boolean };

export const MOCK_CHARACTERS: CharacterItem[] = [
  { id: 'jelly-bear', name: '젤리곰', tint: '#c79ab4', owned: true },
  { id: 'star-candy', name: '별사탕', tint: '#e5b877', owned: false },
  { id: 'cloudy', name: '구름이', tint: '#8fa9c8', owned: false },
  { id: 'sprout', name: '새싹', tint: '#8fbfae', owned: false },
];

/** 배경·폰트 카테고리의 내용은 시안에 없다(docs/screen/09-store.md 7장) */
export const UNDECIDED_CATEGORIES: StoreCategory[] = ['background', 'font'];
