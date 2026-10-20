# Loki 쿼리 모음 (LogQL)

라벨은 `service`, `env`, `level`만 쓴다. 나머지는 `| json` 뒤 필드 필터.

## 요청 하나 전체 (traceId로)
```logql
{service="order-api"} | json | traceId="4bf92f3577b34da6a3ce929d0e0e4736"
```

## 5xx 발생률 (알림 후보. 가능하면 메트릭 http.server.requests 로)
```logql
sum by (service) (rate({env="prod"} | json | event="http.request.failed" [5m]))
```

## 느린 요청 상위
```logql
{service="order-api"} | json | event="http.request.done" | durationMs > 2000 | line_format "{{.durationMs}}ms {{.method}} {{.path}} trace={{.traceId}}"
```

## 경로별 p95 지연 (로그 기반. 정확한 건 메트릭)
```logql
quantile_over_time(0.95, {service="order-api"} | json | event="http.request.done" | unwrap durationMs [5m]) by (path)
```

## WARN 이벤트 집계 (무엇이 쌓이는지)
```logql
sum by (event) (count_over_time({service="order-api"} | json | level="WARN" [1h]))
```

## 401 원인 분류 (시크릿 드리프트 / 만료 / 누락)
```logql
sum by (reason) (count_over_time({env="prod"} | json | event="auth.token_rejected" [15m]))
```

## 특정 사용자 최근 행동
```logql
{env="prod"} | json | memberId="987" | event =~ "order\\..*|payment\\..*"
```

## 외부 호출 실패
```logql
{env="prod"} | json | event =~ ".*\\.call_failed" | line_format "{{.event}} status={{.status}} {{.durationMs}}ms trace={{.traceId}}"
```

## 배치 미실행 감지 (마지막 finished 로그가 오래됨. 메트릭 batch.last_success_epoch 가 정석)
```logql
count_over_time({service="order-api"} | json | event="batch.finished" | jobName="dailySettlement" [26h])
```

## 예외 클래스별 집계
```logql
sum by (exception_class) (count_over_time({env="prod"} | json | level="ERROR" | label_format exception_class=`{{ regexReplaceAll ":.*" .exception "" }}` [1h]))
```

## Grafana 데이터소스 연결 체크
- Loki > Derived fields: name `TraceID`, regex 대신 JSON 필드 `traceId`, internal link -> Tempo
- Tempo > Trace to logs: tags `service.name` -> `service`, span start/end ±1m, filter by trace ID on
- Tempo > Trace to metrics: `service` 태그로 RED 대시보드
