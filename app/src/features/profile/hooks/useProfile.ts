import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi, type SettingsPatch } from '../api/profileApi';

export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
  storeItems: () => [...profileKeys.all, 'storeItems'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: ({ signal }) => profileApi.me(signal),
    staleTime: 5 * 60_000,
  });
}

export function useStoreItems() {
  return useQuery({
    queryKey: profileKeys.storeItems(),
    queryFn: ({ signal }) => profileApi.storeItems(signal),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => profileApi.updateSettings(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

/** 09 테마·캐릭터 선택. 잠긴 항목은 서버가 422로 막고 앱은 구독 유도를 띄운다. */
export function useSelectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => profileApi.select(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
