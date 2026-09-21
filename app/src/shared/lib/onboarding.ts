import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 온보딩 완료 여부. 서버 호출 없이 로컬 플래그만 본다(docs/screen/01-onboarding.md 6장).
 * 비밀값이 아니므로 AsyncStorage로 충분하다. 토큰·개인정보는 여기 넣지 않는다
 * (expo-app-conventions 3장 - AsyncStorage는 평문이다).
 */
const KEY = 'onboarding_done';

export async function isOnboardingDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    // 저장소를 못 읽으면 온보딩을 한 번 더 보여주는 쪽이 안전하다
    return false;
  }
}

export async function markOnboardingDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // 플래그 저장 실패로 진입을 막지 않는다
  }
}
