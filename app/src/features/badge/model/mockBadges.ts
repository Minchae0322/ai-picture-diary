/**
 * 뱃지 목록. **목 데이터다.**
 *
 * 뱃지 도메인이 아직 없다(프로젝트 스킬 8장).
 * 붙는 자리: `GET /api/v1/badges` -> 마스터 정의(이름·조건 문구) + 사용자별 획득 여부·일시.
 * **조건 문구도 서버가 준다.** 앱 업데이트 없이 뱃지를 추가하기 위해서다
 * (docs/screen/07-badge.md 6장).
 *
 * 시안에 있는 12종만 담았다. 나머지 28종은 미정이다(같은 문서 7장).
 */
export type Badge = { id: string; name: string; condition: string; owned: boolean };

export const MOCK_BADGES: Badge[] = [
  { id: 'first', name: '첫 기록', condition: '1일', owned: true },
  { id: 'jelly7', name: '젤리 7', condition: '7일 연속', owned: true },
  { id: 'jelly14', name: '젤리 14', condition: '14일 연속', owned: true },
  { id: 'sunny10', name: '맑음 수집가', condition: '맑음 10회', owned: true },
  { id: 'rain5', name: '비 오는 날', condition: '비 5회', owned: true },
  { id: 'rainbow30', name: '무지개 30', condition: '30일 연속', owned: false },
  { id: 'season', name: '사계절', condition: '365일', owned: false },
  { id: 'explorer', name: '감정 탐험가', condition: '6종 전부', owned: false },
  { id: 'dawn', name: '새벽 기록', condition: '04시 기록', owned: false },
  { id: 'share10', name: '공유왕', condition: '10회 공유', owned: false },
  { id: 'comment', name: '첫 댓글', condition: '커뮤니티', owned: false },
  { id: 'premium', name: '프리미엄', condition: '구독 시작', owned: false },
];
