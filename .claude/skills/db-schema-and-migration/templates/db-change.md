# <변경 제목>

> YYYY-MM-DD · DB 변경 · 관련 커밋 <hash> · 작성 <이름>
> SQL: `sql/patch/YYYY-MM-DD-<설명>.sql` · 롤백: `sql/patch/YYYY-MM-DD-<설명>-rollback.sql` · ERD: `docs/erd/schema-logical.dbml` 갱신 여부

## 1. 무엇을, 왜
- 변경: (예: `tb_article`에 `published_at TIMESTAMPTZ` 추가, 부분 인덱스 1개)
- 이유: (예: 발행 시각 기준 정렬/필터가 필요. 현재는 `updated_at`을 대신 써서 수정 시 순서가 바뀜)
- 분류: 추가만(안전) / 위험(expand-contract 단계 N/3) / 대량 백필

## 2. 영향
| 테이블 | 행 수(추정) | 변경 | 예상 락/시간 |
|---|---|---|---|
| `tb_article` | 1.2M | 컬럼 추가, 인덱스 | ADD COLUMN 즉시, CONCURRENTLY 인덱스 약 2분 |

- 코드 영향: (엔티티/리포지토리/API 목록)
- 하위 호환: 구버전 코드가 이 DDL 이후에도 동작하는가 (예: nullable 추가라 동작함)

## 3. 실행 순서
1. `dev`: SQL 실행 -> 확인 SQL -> 앱 기동(`ddl-auto: validate` 통과)
2. (스테이징이 있으면) 동일하게 한 번 더
3. 코드 배포 vX.Y.Z
4. `prod`: DDL 실행 (야간 / 트래픽 낮은 시간) -> 확인 SQL
5. (contract 단계가 있으면) 다음 배포 주기에 `sql/patch/...-2.sql`

## 4. 롤백
- 조건: (예: 인덱스 생성 실패, 앱 기동 실패)
- 방법: 롤백 SQL 실행 -> 코드 롤백 순서 (또는 코드 먼저)
- 데이터 손실 여부:

## 5. 실행 후 확인 SQL
```sql
SELECT count(*) FROM tb_article WHERE published_at IS NULL AND status = 'PUBLISHED';  -- 기대 0
```

## 실행 기록 (실행한 사람이 채운다)
| 환경 | 일시 | 실행자 | 결과 (행 수 / 소요) | 비고 |
|---|---|---|---|---|
| dev | | | | |
| prod | | | | |
