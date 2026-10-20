import { request } from '@/shared/api/httpClient';

export type GuestAccount = {
  userId: number;
  /** 이번 호출에 새로 만들어졌는지. 이미 있던 기기면 false */
  registered: boolean;
};

/** 로그인 전 기기 등록. **이 호출만 X-User-Id 없이 나간다** - 번호를 받으러 가는 자리다. */
export const accountApi = {
  registerDevice: (deviceUuid: string) =>
    request<GuestAccount>('/api/v1/guest/devices', {
      method: 'POST',
      body: { deviceUuid },
      anonymous: true,
    }),
};
