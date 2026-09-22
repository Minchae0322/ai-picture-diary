# 2026-09-22 뱃지·커뮤니티·프로필 테이블 추가

> 2026-09-22 · DB 변경 · SQL `sql/patch/2026-09-22-badge-community-profile-테이블-추가.sql`

## 무엇을
화면 05~10 구현에 필요한 테이블 5개와 시퀀스 5개 추가.

| 테이블 | 화면 | 담는 것 |
|---|---|---|
| `tb_user_badge` | 07 | 사용자가 획득한 뱃지 |
| `tb_community_post` | 08 | 피드 글. 04에서 공유한 일기의 복사본 |
| `tb_post_like` | 08 | 좋아요 1건 |
| `tb_post_report` | 08 | 신고 1건 |
| `tb_profile` | 09·10 | 닉네임·가입일·구독 여부·테마/캐릭터 선택·설정 |

## 왜
- **05 캘린더 / 06 그래프에는 새 테이블이 없다.** `tb_diary`를 기간으로 잘라 집계한다. 하루 1건이라 한 달 31행 · 1년 365행이 상한이고 그 정도로는 집계 테이블이 필요하지 않다.
- **상점 카탈로그는 테이블이 아니라 코드 enum이다.** 항목이 8개이고 가격·재고가 없다. 결제나 개별 구매가 생기면 그때 마스터 테이블로 옮긴다.

> [!NOTE]
> 뱃지 정의는 이 문서를 쓸 때 코드 enum이었으나 같은 날 `2026-09-22-badge-마스터-테이블.sql` 로
> `tb_badge` 에 옮겼다. 그 패치가 `tb_user_badge.badge_type` 을 `badge_code` 로 바꾼다.
> **두 파일을 순서대로 실행한다.**
- `tb_profile`은 인증이 붙기 전까지 **사용자 테이블을 겸한다.** 회원가입이 생기면 계정 정보는 그쪽으로 가고 여기엔 표시 설정만 남는다.

## 영향
- 전부 신규 테이블. 기존 데이터 영향 없음.
- 애플리케이션은 `ddl-auto: validate`라 이 SQL이 먼저 실행돼야 기동된다.
- `tb_profile` 행은 앱이 만들지 않는다. `GET /api/v1/profile` 첫 호출에 서버가 기본값으로 만든다.

## 실행 순서
1. 개발 DB에 SQL 실행 (담당: 개발자)
2. 애플리케이션 기동 확인 (`validate` 통과 = 매핑 일치)
3. 운영은 최초 배포 시 동일 순서

## 제약과 인덱스

| 이름 | 종류 | 의미 |
|---|---|---|
| `ux_user_badge_user_id_badge_type` | unique(부분) | 같은 뱃지 두 번 지급 금지. 동시 이벤트의 멱등성을 DB가 보장 |
| `ux_community_post_diary_id` | unique(부분) | 같은 일기 두 번 공유 금지 |
| `ix_community_post_id_desc` | index(부분) | 최신 정렬 커서 |
| `ix_community_post_like_count_id_desc` | index(부분) | 인기 정렬 커서 (like_count DESC, id DESC) |
| `ck_community_post_like_count` | check | 좋아요 수 음수 금지 |
| `ux_post_like_post_id_user_id` | unique(부분) | 좋아요 연타·중복 방지 |
| `ux_post_report_post_id_user_id` | unique(부분) | 같은 글 반복 신고 방지 |
| `ux_profile_user_id` | unique(부분) | 사용자당 프로필 1개 |

날씨 필터는 값이 6종뿐이라 선택도가 낮다. 인덱스에 넣지 않고 정렬 키만 인덱스로 받았다.

## 롤백
SQL 파일 하단 주석의 `DROP` 순서(자식 -> 부모)를 그대로 쓴다.

## 실행 기록
| 환경 | 일시 | 담당 | 소요 | 비고 |
|---|---|---|---|---|
| local |  |  |  | 미실행 |
| dev |  |  |  | 미실행 |
