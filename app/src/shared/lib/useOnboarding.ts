import { useEffect, useState } from 'react';
import { isOnboardingDone } from './onboarding';

/** null = 아직 읽는 중. 읽는 동안 화면을 그리지 않아 온보딩이 깜빡이는 것을 막는다 */
export function useOnboardingDone(): boolean | null {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void isOnboardingDone().then((value) => {
      if (alive) {
        setDone(value);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return done;
}
