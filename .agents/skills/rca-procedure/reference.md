# rca-procedure - 참고 자료

`SKILL.md`의 절차에 대한 이유, 예시, 보고서 템플릿, 참고 링크를 담는다. SKILL.md와 함께 읽는다.

## 절차 - 이유와 예시

### 1단계. 복구 우선 (완화)

- "무엇이 바뀌었나"를 가장 먼저 묻는 이유: 장애의 대다수는 변경 직후에 발생한다.
- 완화 조치 전에 증거를 보존하는 이유: 재시작하면 힙/스레드 상태가 사라진다.

### 2단계. 증거 수집

- 최초 오류 메시지는 가장 먼저 나온 것이 원인에 가깝다. 이후 오류는 대개 연쇄 결과다.
- 타임라인의 시간대가 섞이면 인과가 뒤집힌다. 그래서 UTC 또는 KST 중 하나로 통일한다.

### 3단계. 타임라인 예시

```
09:41:03  배포 v2.13.0 완료 (변경: 기사 검색 쿼리 리팩터링)
09:43:10  p99 응답시간 300ms -> 4.2s (article-service)
09:43:55  HikariPool-1 pending connections 0 -> 20 (풀 최대치)
09:44:20  첫 알림. ERROR "Connection is not available, request timed out after 30000ms"
09:52:00  롤백 결정
09:55:30  롤백 완료, p99 정상화
```

타임라인이 있으면 원인 후보가 저절로 좁혀진다. 여기서 "가장 먼저 이상해진 지표"가 출발점이다.

### 4단계. 가설 검증 예시와 5 Whys

- 가설 검증 예: "새 쿼리가 인덱스를 안 타서 느려짐 -> 커넥션 점유 -> 풀 고갈" 이라면, 슬로우 쿼리 로그에 해당 SQL이 있어야 하고 EXPLAIN에서 Seq Scan이 보여야 한다.
- 5 Whys 예:
  1. 왜 장애? 커넥션 풀 고갈.
  2. 왜 고갈? 검색 쿼리가 4초씩 커넥션을 잡음.
  3. 왜 느림? 리팩터링 후 WHERE에 함수가 걸려 인덱스 미사용.
  4. 왜 배포됨? 리뷰/테스트에서 실행계획 검증 절차가 없음.
  5. 왜 없음? 성능 회귀 테스트가 파이프라인에 없음. <- 재발 방지 지점
- 스테이징에서 같은 조건으로 재현되면 원인이 확정된다.

### 6단계. 재발 방지 세 층

- **탐지**: 이 장애를 더 빨리 알 수 있었던 알림/대시보드.
- **완화**: 같은 문제가 생겨도 영향을 줄이는 장치(타임아웃, 서킷 브레이커, 리소스 제한, 자동 롤백).
- **예방**: 원인 자체를 막는 변경(코드 수정, 테스트 추가, 리뷰 체크리스트, 파이프라인 게이트).

재발 방지의 "탐지" 항목은 대개 `logging-observability` 스킬의 5장/8장 누락이다.

## 보고서 템플릿

```markdown
# [SEV2] 기사 검색 응답 지연 및 커넥션 풀 고갈 (2026-09-07)

## 요약
09:43~09:55 (12분) article-service 검색 API p99 4초 이상, 오류율 38%.
원인: v2.13.0 배포에 포함된 검색 쿼리 리팩터링이 인덱스를 사용하지 못해 커넥션 점유 시간이 늘고 풀이 고갈됨.
조치: 롤백으로 복구. 쿼리 수정 및 실행계획 검증 절차 추가 예정.

## 영향
- 사용자: 기자단 검색 기능 사용자 전체, 약 12분
- 데이터: 손실/오염 없음

## 타임라인 (KST)
| 시각 | 내용 |
|---|---|
| 09:41 | v2.13.0 배포 |
| ... | ... |

## 원인 (Root Cause)
- 직접 원인: `WHERE DATE(published_at) = ?` 로 변경되어 `idx_article_published_at` 미사용, Seq Scan 발생
- 근본 원인: 쿼리 변경 시 실행계획을 검증하는 절차가 없음
- 증거: 슬로우 쿼리 로그(첨부 1), EXPLAIN 결과(첨부 2), HikariCP 메트릭(첨부 3)

## 잘 된 점 / 아쉬운 점
- 잘 된 점: 알림 후 2분 내 대응 시작, 롤백 결정이 빠름
- 아쉬운 점: 풀 pending 알림이 없어 사용자 신고로 인지

## 재발 방지 조치
| 구분 | 조치 | 담당 | 기한 |
|---|---|---|---|
| 예방 | 범위 조건으로 쿼리 수정 + 리포지토리 테스트 추가 | 정민채 | 09-09 |
| 탐지 | HikariCP pending > 5 알림 추가 | - | 09-12 |
| 완화 | 검색 API 쿼리 타임아웃 3초 설정 | - | 09-12 |
| 예방 | 리뷰 체크리스트에 "쿼리 변경 시 EXPLAIN 첨부" 추가 | - | 09-12 |

## 미확인 사항
- 같은 시간대 JTV 환경에는 영향이 없었는지 확인 필요 (추정: 배포 안 됨)
```

## 참고

- `logging-observability` 스킬 - 이 절차가 읽는 로그를 미리 남기는 규칙. 재발 방지의 "탐지" 항목은 대개 그 스킬의 5장/8장 누락이다
- Google SRE Book - Postmortem Culture: https://sre.google/sre-book/postmortem-culture/
- Google SRE Workbook - Postmortem 예시: https://sre.google/workbook/postmortem-analysis/
- HikariCP - Configuration / 풀 고갈 진단: https://github.com/brettwooldridge/HikariCP
- JDK `jcmd` 사용법: https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html
- Kubernetes - Debugging Pods: https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/
