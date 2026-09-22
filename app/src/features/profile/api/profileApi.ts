import { request } from '@/shared/api/httpClient';

export type StoreCategory = 'THEME' | 'CHARACTER';

export type Profile = {
  nickname: string;
  themeCode: string;
  themeName: string;
  characterCode: string;
  characterName: string;
  plus: boolean;
  joinedOn: string;
  reminderTime: string | null;
  aiStyle: string;
  diaryLock: boolean;
};

export type StoreItem = {
  code: string;
  category: StoreCategory;
  name: string;
  description: string;
  plusOnly: boolean;
  /** 서버가 구독 상태를 보고 정한다. 클라이언트 플래그를 믿지 않는다(09 화면 문서 6장). */
  locked: boolean;
  selected: boolean;
};

export type SettingsPatch = {
  nickname?: string;
  reminderTime?: string | null;
  aiStyle?: string;
  diaryLock?: boolean;
};

export const profileApi = {
  me: (signal?: AbortSignal) => request<Profile>('/api/v1/profile', { signal }),

  updateSettings: (patch: SettingsPatch) =>
    request<Profile>('/api/v1/profile/settings', { method: 'PATCH', body: patch }),

  storeItems: (signal?: AbortSignal) =>
    request<StoreItem[]>('/api/v1/profile/store/items', { signal }),

  select: (code: string) =>
    request<Profile>(`/api/v1/profile/store/items/${code}/select`, { method: 'POST' }),
};
