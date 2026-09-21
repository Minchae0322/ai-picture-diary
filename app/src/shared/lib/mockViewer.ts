/**
 * 지금 앱을 보고 있는 사람. **목 데이터다.**
 *
 * 인증이 아직 없어(`X-User-Id` 헤더 임시) 서버가 닉네임·가입일·캐릭터를 주지 않는다.
 * 02 인사말과 10 프로필이 같은 값을 써야 해서 feature가 아니라 shared에 둔다.
 * 붙는 자리: 인증 도입 시 `GET /api/v1/me` (spring-auth).
 */
export const MOCK_VIEWER = {
  nickname: '승희',
  character: '젤리곰',
  joinedAt: '2026.03.02',
  plus: true,
} as const;
