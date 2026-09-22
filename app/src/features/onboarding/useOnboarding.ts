import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'onboarding_done';

/**
 * 01 완료 여부. 서버가 알 필요 없는 기기별 사실이라 로컬에만 둔다(01 화면 문서 6장).
 * 값을 읽기 전에는 'unknown' 이다 - 이때 홈을 먼저 그리면 온보딩이 깜빡였다 사라진다.
 */
export function useOnboardingDone(): 'unknown' | 'done' | 'pending' {
  const [state, setState] = useState<'unknown' | 'done' | 'pending'>('unknown');

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((value) => alive && setState(value === 'true' ? 'done' : 'pending'))
      // 저장소를 못 읽으면 온보딩을 다시 보여준다 - 홈이 막히는 것보다 낫다
      .catch(() => alive && setState('pending'));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true').catch(() => undefined);
}
