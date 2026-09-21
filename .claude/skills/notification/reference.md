# notification - 참고

SKILL.md의 절 번호와 같은 순서.

## 0. 광고성 정보 법적 요건 (2026-09 확인)

정보통신망법 제50조 기준. **법 조문과 해석은 바뀔 수 있으므로 서비스 오픈 전에 최신 내용을 확인한다.**

| 요건 | 내용 |
|---|---|
| 사전 동의 | 영리 목적 광고성 정보는 명시적 사전 동의 필수. 거래 관계가 있으면 거래 종료 후 6개월 내 동일·유사 상품에 한해 예외 |
| 야간 전송 | 오후 9시~다음날 오전 8시는 **별도의 사전 동의** 필요 (전자우편 제외) |
| 표기 | 제목/본문에 "(광고)" 표시. 회피용 변형 표기 금지 |
| 전송자 정보 | 명칭과 연락처 명시 |
| 수신거부 | 비용 부담 없이 쉽게 철회할 수 있는 방법 명시 |
| 정기 확인 | 동의 후 **매 2년마다** 동의 여부 확인 및 안내(명칭, 동의 날짜, 철회 방법) |
| 과태료 | 동의 없는 전송·표기 누락·수신거부 방해 시 3천만원 이하 |

정보성 vs 광고성 구분 예:

| 알림 | 구분 |
|---|---|
| 주문 확인, 배송 알림, 결제 완료, 인증번호 | 정보성 (동의 불필요) |
| 비밀번호 변경, 로그인 알림, 약관 변경 고지 | 정보성 |
| 일방적 쿠폰 지급, 회원 등급 변경 안내, 재입고 알림, 이벤트 | **광고성** |
| "고객님만을 위한 혜택" | 광고성 |

출처: [광고성 정보 전송 가이드라인](https://developers.fingerpush.com/assemble/guide/ads), [정보통신망법 국가법령정보센터](https://www.law.go.kr/)

경계가 애매하면 광고성으로 처리한다. 잘못 보내는 비용이 안 보내는 비용보다 훨씬 크다.

## 2. 알림 종류 정의

```java
public enum NotificationType {

    // 정보성
    ORDER_CONFIRMED("주문 확인",   Category.TRANSACTIONAL, EnumSet.of(PUSH, INAPP, ALIMTALK), true),
    SHIPPING_STARTED("배송 시작",  Category.TRANSACTIONAL, EnumSet.of(PUSH, INAPP, ALIMTALK), true),
    COMMENT_ADDED("내 글에 댓글",  Category.TRANSACTIONAL, EnumSet.of(PUSH, INAPP), true),

    // 광고성 - 기본 off, 동의 필수, 야간 금지
    COUPON_ISSUED("쿠폰 지급",     Category.MARKETING,     EnumSet.of(PUSH, INAPP), false),
    RESTOCK_ALERT("재입고 알림",   Category.MARKETING,     EnumSet.of(PUSH, INAPP), false);

    private final String label;
    private final Category category;
    private final Set<Channel> channels;
    private final boolean defaultEnabled;

    public boolean requiresMarketingConsent() {
        return category == Category.MARKETING;
    }

    public enum Category { TRANSACTIONAL, MARKETING }
}
```

`requiresMarketingConsent()`를 발송 경로에서 강제로 거치게 하면, 새 알림을 추가하는 사람이 분류를 의식하게 된다.

## 4. 발송 파이프라인

```java
// 도메인 이벤트 -> 발송 요청 저장 (같은 트랜잭션)
@Transactional
public Long placeOrder(OrderCommand command) {
    Order order = orderRepository.save(Order.place(command));
    notificationRequestService.enqueue(NotificationRequest.of(
            NotificationType.ORDER_CONFIRMED,
            order.getMemberId(),
            "order:" + order.getId(),                  // 사건 키 (중복 방지)
            Map.of("orderNo", order.getOrderNo())));   // 템플릿 변수
    return order.getId();
}
```

```java
// 커밋 후 발송
@TransactionalEventListener(phase = AFTER_COMMIT)
void on(NotificationEnqueued event) {
    dispatcher.dispatch(event.requestId());     // 또는 큐/배치에 위임
}
```

```java
@Component
class NotificationDispatcher {

    @Transactional(propagation = REQUIRES_NEW)
    public void dispatch(Long requestId) {
        NotificationRequest request = repository.findById(requestId).orElseThrow();

        // 발송 직전 재확인 - 요청 저장 이후 사용자가 껐을 수 있다
        if (!consentService.canSend(request.getUserId(), request.getType(), Instant.now())) {
            request.markSkipped("CONSENT_DENIED");
            return;
        }

        RenderedMessage message = templateService.render(request);   // 변수 누락이면 여기서 실패

        for (Channel channel : request.getType().channels()) {
            try {
                SendResult result = senders.get(channel).send(request.getUserId(), message);
                repository.saveHistory(NotificationHistory.sent(request, channel, result));
            } catch (PermanentSendException e) {
                repository.saveHistory(NotificationHistory.failed(request, channel, e));
                tokenService.deactivateIfTokenIssue(e);              // 6장
            } catch (TransientSendException e) {
                repository.saveHistory(NotificationHistory.retryable(request, channel, e));
            }
        }
    }
}
```

`INAPP` 채널은 항상 성공하는 로컬 저장이다. 푸시가 실패해도 알림함에는 남는다.

### 수신 동의 확인 순서

```java
boolean canSend(Long userId, NotificationType type, Instant now) {
    if (!settingRepository.isEnabled(userId, type)) return false;       // 종류별 설정

    if (type.requiresMarketingConsent()) {
        MarketingConsent consent = consentRepository.find(userId).orElse(null);
        if (consent == null || !consent.isActive(now)) return false;    // 동의 + 2년 유효
        if (isNightTime(now) && !consent.isNightAgreed()) return false; // 21:00~08:00 별도 동의
    }
    return true;
}

private boolean isNightTime(Instant now) {
    LocalTime time = LocalTime.ofInstant(now, ZoneId.of("Asia/Seoul"));
    return time.isAfter(LocalTime.of(20, 59, 59)) || time.isBefore(LocalTime.of(8, 0));
}
```

야간에 발송 요청이 들어오면 **차단이 아니라 아침 8시로 지연 예약**하는 것이 보통 더 낫다. 정책을 문서에 적는다.

## 5. 중복 방지와 대량 발송 안전장치

```sql
-- 같은 사건에 같은 알림을 두 번 만들지 않는다
constraint ux_notification_request unique (type, user_id, event_key)
```

```java
try {
    repository.saveAndFlush(request);
} catch (DataIntegrityViolationException e) {
    log.debug("이미 요청된 알림, 건너뜀: {} {}", request.getType(), request.getEventKey());
    return;   // 정상 종료. 예외를 올리지 않는다
}
```

```java
// 대량 발송 - 대상 수 확인 단계
public BulkSendPlan plan(BulkSendCommand command) {
    long targetCount = targetRepository.count(command.criteria());
    if (targetCount > properties.bulkConfirmThreshold()) {
        return BulkSendPlan.requiresConfirmation(targetCount);   // 사람이 확인해야 진행
    }
    return BulkSendPlan.ready(targetCount);
}
```

조건 실수로 전체 사용자에게 나가는 사고는 되돌릴 수 없다. **임계값을 넘으면 사람 확인**을 강제한다.

### 비운영 환경 차단

```java
@Component
@Profile("!prod")
class SafeModeSender implements NotificationSender {

    private final Set<String> allowList;   // 내부 테스터 계정만

    @Override
    public SendResult send(Long userId, RenderedMessage message) {
        if (!allowList.contains(userService.emailOf(userId))) {
            log.info("[SAFE MODE] 발송 생략 userId={} title={}", userId, message.title());
            return SendResult.skipped();
        }
        return delegate.send(userId, message);
    }
}
```

## 6. FCM HTTP v1

레거시 FCM API(서버 키 기반 `/fcm/send`)는 종료되었다. **HTTP v1**을 쓴다.

- 인증: 서버 키가 아니라 **서비스 계정 JSON**으로 OAuth2 액세스 토큰을 받아 `Authorization: Bearer`로 보낸다. Firebase Admin SDK를 쓰면 처리해 준다.
- 서비스 계정 JSON은 절대 커밋하지 않는다. 환경변수 또는 시크릿 매니저로 주입(`config-and-secrets`).
- 메시지 구조가 플랫폼별로 나뉜다: 공통 `notification` + `android`/`apns`/`webpush` 오버라이드.
- 응답 에러 코드 중 `UNREGISTERED`, `INVALID_ARGUMENT`(토큰 형식)는 **영구 실패**다. 토큰을 비활성화한다.

```java
Message message = Message.builder()
        .setToken(deviceToken)
        .setNotification(Notification.builder()
                .setTitle(rendered.title())
                .setBody(rendered.body())
                .build())
        .putData("type", type.name())
        .putData("targetId", String.valueOf(targetId))     // 딥링크용
        .setAndroidConfig(AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH)
                .build())
        .setApnsConfig(ApnsConfig.builder()
                .setAps(Aps.builder().setSound("default").setBadge(badgeCount).build())
                .build())
        .build();

try {
    firebaseMessaging.send(message);
} catch (FirebaseMessagingException e) {
    if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED
            || e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT) {
        tokenRepository.deactivate(deviceToken);           // 영구 실패
        throw new PermanentSendException(e);
    }
    throw new TransientSendException(e);
}
```

출처: [FCM 레거시 API 마이그레이션 문서](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

APNs 키(.p8)와 Firebase 서비스 계정 JSON의 보관·설정은 `app-store-release`와 `config-and-secrets`에 함께 정리돼 있다.

## 3. 알림톡 주의점

- **발신프로필**(카카오 채널) 등록과 **템플릿 사전 승인**이 선행된다. 승인에 영업일이 걸리므로 일정에 반영한다.
- 승인된 템플릿의 문구를 코드에서 바꾸면 발송이 거부된다. 템플릿 ID와 변수만 넘기는 구조로 만든다.
- 광고성 문구(할인, 이벤트, 프로모션)는 알림톡 템플릿에 넣을 수 없다. 광고는 친구톡/문자로 분리한다.
- 대체발송(SMS/LMS)을 켜면 실패 시 자동으로 문자가 나간다. **비용과 내용(알림톡 템플릿이 문자로 그대로 나감)**을 확인하고 켠다.
- 발송 대행사(비즈니스 메시지 사업자)마다 API가 다르다. 어댑터로 감싸 두면 대행사 교체가 쉽다(`external-api-client`).

## 7. 실패 분류

| 채널 | 영구 실패 (재시도 금지, 비활성화) | 일시 실패 (재시도) |
|---|---|---|
| FCM | `UNREGISTERED`, 토큰 형식 오류 | `UNAVAILABLE`, `INTERNAL`, 429 |
| APNs | `BadDeviceToken`, `Unregistered` | `TooManyRequests`, `ServiceUnavailable` |
| 이메일 | hard bounce, 수신거부 목록 | soft bounce, 5xx |
| SMS/알림톡 | 잘못된 번호, 수신거부 | 사업자 5xx, 한도 초과 |

영구 실패를 재시도하면 비용만 늘고 발신자 평판(이메일)이 떨어진다.

## 8. 보관과 정리

```java
// 발송 이력 보관 기간 후 삭제 (batch-and-scheduler)
// - 법적 보관 의무가 있는 종류(계약, 결제)는 별도 기간
// - 나머지는 6개월~1년 후 삭제 또는 집계만 남기고 상세 삭제
```

수신 동의 이력은 **분쟁 대비로 더 길게** 보관한다(동의 시각, 동의 경로, IP). 언제 어떻게 동의받았는지 증명할 수 없으면 동의가 없는 것과 같다.

## 참고

- FCM HTTP v1 마이그레이션: https://firebase.google.com/docs/cloud-messaging/migrate-v1
- Firebase Admin SDK (Java): https://firebase.google.com/docs/admin/setup
- Apple - Sending notification requests to APNs: https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server
- 카카오 비즈메시지(알림톡) 안내: https://business.kakao.com/info/bizmessage/
- 국가법령정보센터 - 정보통신망법: https://www.law.go.kr/
