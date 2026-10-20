import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_KEY = 'guest_device_uuid';
const USER_KEY = 'guest_user_id';

/**
 * 게스트 식별자를 기기에 둔다. **`AsyncStorage` 를 쓰지 않는다** - 평문이라 개인정보를 담을 수 없다
 * (프로젝트 스킬 즉시 금지). 기기 UUID 는 ADR 2026-10-20 에서 개인정보로 다루기로 했다.
 *
 * <p>`expo-secure-store` 는 iOS 키체인 / 안드로이드 KeyStore 에 넣는다. 앱을 지우면 함께 사라지고,
 * 그때는 새 기기로 등록된다 - 로그인 전 기록이 기기에 묶여 있다는 뜻이고 ADR 이 받아들인 한계다.
 */
export async function readDeviceUuid(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_KEY);
}

/** 없으면 만들어 저장한다. UUID 는 `Math.random` 이 아니라 암호학적 난수로 뽑는다 */
export async function ensureDeviceUuid(): Promise<string> {
  const saved = await readDeviceUuid();
  if (saved) {
    return saved;
  }
  const created = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_KEY, created);
  return created;
}

/**
 * 서버가 내준 사용자 번호. 기기 등록은 멱등이라 다시 물어도 같은 값이지만,
 * **네트워크가 없을 때도 앱이 뜨게** 하려고 받은 값을 들고 있는다.
 */
export async function readUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_KEY);
}

export async function writeUserId(userId: string): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, userId);
}
