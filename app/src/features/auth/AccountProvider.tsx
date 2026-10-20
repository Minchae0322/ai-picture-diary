import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setRequestUserId } from '@/shared/api/httpClient';
import { accountApi } from './api/accountApi';
import { ensureDeviceUuid, readUserId, writeUserId } from './accountStorage';

/**
 * `loading` 아직 사용자 번호가 없다. 이 동안 API 를 부르면 401 이 난다
 * `guest`   기기로 받은 번호를 쓰는 중. 핵심 루프(02~06)는 전부 되고 로그인 벽 네 곳이 막힌다
 * `member`  로그인한 사람. **아직 이 상태가 되는 길이 없다** - 인증이 붙으면 생긴다
 */
export type AccountStatus = 'loading' | 'guest' | 'member';

type Account = {
  status: AccountStatus;
  userId: string | null;
  /** 기기 등록이 실패한 이유. 네트워크가 없으면 저장된 번호로 계속 간다 */
  error: unknown;
  /**
   * 인증이 붙기 전까지 로그인 벽을 열어 두는 임시 통로(ADR 2026-10-20).
   * 통과할 수단이 없는 벽은 기능을 통째로 죽인다. **인증이 붙는 날 이 둘을 지운다.**
   */
  bypassed: boolean;
  bypass: () => void;
  retry: () => void;
};

const AccountContext = createContext<Account | null>(null);

/**
 * 로그인하지 않은 사람에게 기기 단위 사용자 번호를 쥐어 준다(ADR 2026-10-20).
 *
 * <p>순서가 중요하다. **번호를 손에 넣기 전에는 다른 화면을 그리지 않는다** - 그 사이에 나간 요청은
 * 헤더가 비어 401 로 떨어지고, 화면마다 그 상태를 따로 다루게 된다.
 */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AccountStatus>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [bypassed, setBypassed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;

    const apply = (id: string) => {
      if (!alive) {
        return;
      }
      // 헤더가 먼저다. 화면이 그려지는 순간 쿼리가 나간다
      setRequestUserId(id);
      setUserId(id);
      setStatus('guest');
    };

    (async () => {
      // 저장된 번호가 있으면 그것으로 먼저 연다. 서버에 다시 물을 이유가 없고, 비행기 모드에서도 열린다
      const saved = await readUserId().catch(() => null);
      if (saved) {
        apply(saved);
        return;
      }
      try {
        const uuid = await ensureDeviceUuid();
        const account = await accountApi.registerDevice(uuid);
        const id = String(account.userId);
        await writeUserId(id);
        apply(id);
      } catch (e) {
        if (alive) {
          setError(e);
          setStatus('loading');
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [attempt]);

  const value = useMemo<Account>(
    () => ({
      status,
      userId,
      error,
      bypassed,
      bypass: () => setBypassed(true),
      retry: () => {
        setError(null);
        setAttempt((n) => n + 1);
      },
    }),
    [status, userId, error, bypassed],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): Account {
  const account = useContext(AccountContext);
  if (account === null) {
    throw new Error('AccountProvider 안에서만 쓴다');
  }
  return account;
}

/**
 * 이 화면에 로그인이 필요한가. 벽 네 곳(07·08·09·10)이 이 답으로 갈린다.
 * 임시 통로를 지나온 사람은 통과시킨다.
 */
export function useLoginRequired(): boolean {
  const { status, bypassed } = useAccount();
  return status !== 'member' && !bypassed;
}
