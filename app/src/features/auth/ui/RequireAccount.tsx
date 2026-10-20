import type { ReactNode } from 'react';
import { useLoginRequired } from '../AccountProvider';
import { LoginSheet } from './LoginSheet';

type Props = {
  feature: string;
  reason: string;
  children: ReactNode;
};

/**
 * 로그인 벽을 세우는 자리. 07·08·09·10 화면이 통째로 이것을 두른다(ADR 2026-10-20).
 *
 * <p>**children 을 그대로 그린 뒤 그 위에 시트를 올린다.** 내용을 지우지 않는 것이 핵심이다 -
 * 뒤에 무엇이 있는지 보여야 로그인할 이유가 생긴다.
 *
 * <p>서버도 같은 벽을 들고 있다(`CommunityService.requireAccount`). 화면이 유일한 방어선이면
 * 방어선이 아니다.
 */
export function RequireAccount({ feature, reason, children }: Props) {
  const blocked = useLoginRequired();

  return (
    <>
      {children}
      {blocked ? <LoginSheet feature={feature} reason={reason} /> : null}
    </>
  );
}
