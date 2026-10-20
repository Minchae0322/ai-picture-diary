# app-store-release - 참고 자료

`SKILL.md`의 체크리스트에 대한 이유, 상세 표, 명령, 참고 링크를 담는다. SKILL.md와 함께 읽는다.

---

## 목적 (배경)

App Store와 Google Play는 심사 기준이 다르고, 둘 다 매년 바뀌며, 리젝 사유의 대부분은 코드가 아니라 **누락된 선언, 없는 화면, 빠진 URL**이다. 이 스킬은 (1) 제출 전에 두 스토어 + 한국 법규를 한 체크리스트로 점검하고, (2) 필요한 키와 설정 파일을 빠짐없이 만들고, (3) 제출 순서를 정해 한 번에 통과하는 것을 목표로 한다.

기준 시점: **2026-09 확인.** 정책은 바뀐다. 날짜가 붙은 항목은 제출 전에 각 스토어 공식 페이지(참고 절)에서 다시 확인한다.

기본 스택은 Expo(React Native) + EAS Build/Submit이다. Flutter나 네이티브 프로젝트도 심사 체크리스트는 동일하고, 설정 파일 절만 해당 도구로 바꿔 읽는다.

---

## 0. 시작 전 결정 (원문 표)

| 결정 | 선택지 | 기준 |
|---|---|---|
| Apple 계정 유형 | 개인 / 조직 | 조직은 D-U-N-S 번호 필요(발급 1~2주). 개인은 본명이 스토어에 노출. 연 99 USD |
| Google 계정 유형 | 개인 / 조직 | 개인 계정(2023-11-13 이후 생성)은 **비공개 테스트 12명 x 14일**이 프로덕션 전 필수. 조직은 면제. 일회 25 USD. 조직은 D-U-N-S 필요 |
| 로그인 | 없음 / 자체 / 소셜 | 소셜(구글, 카카오, 네이버)을 넣으면 Apple은 **Sign in with Apple 또는 동급 옵션** 필수(4.8). 로그인이 있으면 **계정 삭제 기능**과 **심사용 데모 계정** 필수 |
| 결제 | 없음 / 인앱 / 외부 | 디지털 콘텐츠(구독, 테마, 코인)는 **스토어 인앱 결제 강제**. 실물/서비스는 외부 PG 가능. 헷갈리면 인앱 |
| 사용자 생성 콘텐츠(UGC) | 있음 / 없음 | 커뮤니티, 댓글, 프로필 이미지가 있으면 **신고, 차단, 필터링, 약관 동의** 4종 필수 |
| 위치 | 없음 / 앱 사용 중 / 백그라운드 | 백그라운드 위치는 양쪽 다 별도 심사 + 영상 요구. 한국은 위치기반서비스 사업자 신고 검토 |
| 대상 연령 | 전체 / 청소년 / 성인 | 아동 대상이면 Google Families 정책, Apple Kids 카테고리로 규제가 크게 늘어난다. 처음엔 피한다 |
| 배포 국가 | 한국만 / 글로벌 | EU를 포함하면 DSA 트레이더 상태(주소, 연락처 공개) 필요. 처음엔 한국 + 필요한 나라만 |

---

## 1. 두 스토어 공통 필수 (원문)

### 앱 안에 있어야 하는 것

- **개인정보처리방침 링크가 앱 안에서 열린다** (설정 화면 등). 스토어 등록 페이지의 URL만으로는 부족하다.
- **계정 삭제 기능이 앱 안에 있다** (로그인이 있는 경우). "문의하세요"가 아니라 사용자가 직접 실행. 확인 절차 1~2단계는 허용. 삭제 후 백엔드에서 실제로 데이터가 지워지거나 익명화되어야 하고, 법적 보관 의무가 있는 것만 예외.
- **모든 화면이 완성되어 있다.** "준비 중", lorem ipsum, 빈 목록만 있는 탭, 죽은 링크가 하나라도 있으면 Apple 2.1 리젝.
- **권한 요청 직전에 이유가 보인다.** iOS는 `NS*UsageDescription` 문자열이 구체적이어야 하고("사진을 업로드하기 위해"처럼), Android는 위험 권한 요청 전 설명 UI가 있으면 통과율이 오른다.
- **크래시 없음, 오프라인/느린 네트워크에서 에러 화면이 있음.** 심사자는 실제 기기 + 나쁜 네트워크로 본다.
- **UGC가 있으면**: 콘텐츠 신고 버튼, 사용자 차단, 부적절 콘텐츠 필터(최소 금칙어), 이용약관 동의 화면, 24시간 내 처리한다는 안내.
- **AI 생성 기능이 있으면**: 생성물이 AI가 만든 것임을 표시하고, 생성 콘텐츠에도 신고/필터가 적용된다. 건강, 법률, 금융 조언처럼 보이면 면책 문구.
- **로그인 앱은 로그인 없이 볼 수 있는 화면이 있거나, 심사 노트에 데모 계정을 준다.**

### 스토어 등록 페이지에 있어야 하는 것

- 개인정보처리방침 URL (HTTPS, 실제 접속됨, 앱 이름과 수집 항목이 일치)
- 지원 URL 또는 이메일 (실제 응답 가능)
- 스크린샷: 실제 앱 화면. 기기 프레임 합성은 허용되나 앱에 없는 기능을 보여주면 리젝
- 설명에 다른 플랫폼 언급 금지 (Apple: "안드로이드에서도" 같은 문구 리젝)
- 연령 등급 설문 정직하게. 나중에 바꾸면 재심사
- 데이터 수집 선언(Apple 개인정보 라벨, Google 데이터 보안 양식)이 **실제 SDK 동작과 일치**. Firebase Analytics, 광고 SDK, 크래시 리포터를 넣었으면 "수집 안 함"이라고 쓰면 안 된다

---

## 2. Apple App Store 전용 (상세 표)

| 항목 | 내용 | 확인 시점 |
|---|---|---|
| 빌드 도구 | **Xcode 26 + iOS 26 SDK**로 빌드한 것만 접수 (2026-04-28부터). EAS는 빌드 이미지를 최신으로 | 매년 4월 갱신 |
| Privacy Manifest | `PrivacyInfo.xcprivacy`에 수집 데이터 유형, 추적 도메인, **Required Reason API 사용 사유** 선언. 파일 타임스탬프, UserDefaults, 디스크 용량, 시스템 부팅 시각 API가 대상. 서드파티 SDK도 각자 매니페스트 필요 (2024-05-01부터) | SDK 추가 때마다 |
| 개인정보 라벨 | App Store Connect의 "앱 개인정보 보호" 설문. Privacy Manifest와 일치해야 한다 | 제출 때마다 |
| 4.8 로그인 | 서드파티 로그인(구글, 카카오 등)을 제공하면 Sign in with Apple **또는** 이름/이메일만 수집하고 추적하지 않는 동급 로그인 옵션 필수 | 로그인 추가 시 |
| 5.1.1(v) 계정 삭제 | 앱 내 삭제. 2022-06-30부터 | - |
| 2.1 완성도 / 데모 | 로그인 앱은 심사 노트에 **동작하는 데모 계정**. 백엔드가 심사 기간 내내 살아 있어야 함 | 제출 때마다 |
| 2.3.1 심사 노트 | 새 기능, 외부 서비스(인증, 결제, AI), 테스트 방법을 **구체적으로**. "일반 앱입니다" 같은 노트는 리젝 사유 | 제출 때마다 |
| ATT | 광고 ID나 크로스앱 추적을 하면 `NSUserTrackingUsageDescription` + `ATTrackingManager` 요청. 안 하면 라벨에서 "추적 안 함" | - |
| 수출 규정 | HTTPS만 쓰면 `ITSAppUsesNonExemptEncryption = false`로 매번 묻는 질문 생략 | - |
| 연령 등급 | 2026-01-31부터 새 설문 기준. 기존 앱도 답변 갱신 필요 | - |
| EU 트레이더 | EU 배포 시 트레이더 상태(주소, 전화, 이메일 공개) 없으면 EU에서 내려감 (2025-02-17부터) | 국가 추가 시 |
| 스크린샷 | 6.9" iPhone 필수(다른 크기는 자동 축소), iPad 지원 시 13" iPad 필수 | - |
| 인앱 결제 | 디지털 상품은 StoreKit. 외부 결제 링크/문구 금지(한국은 대안 결제 허용 신청 가능하나 첫 출시엔 피한다) | - |

### Apple 리젝 상위 사유 (공개 자료 기준)

2.1 완성도/크래시/데모 계정 누락, 5.1.1 개인정보(라벨 불일치, 권한 사유 부족, 계정 삭제 없음), 4.8 로그인, 2.3 메타데이터(스크린샷과 다른 기능, 다른 플랫폼 언급), 3.1.1 외부 결제.

---

## 3. Google Play 전용 (상세 표)

| 항목 | 내용 | 확인 시점 |
|---|---|---|
| Target API | **API 36(Android 16)** 이상 (2026-08-31부터 신규/업데이트). 매년 8월 말 1씩 오른다 | 매년 8월 |
| 비공개 테스트 | 개인 계정(2023-11-13 이후 생성): **테스터 12명이 14일 연속 옵트인** 후 프로덕션 접근 신청. 설치만 하면 안 되고 실제 사용 기록이 보여야 한다. 신청서 10문항(테스트 과정, 피드백, 준비 상태). 여유 있게 14~16명 모집. 트랙을 중지하면 타이머 리셋 | 첫 출시 |
| 계정 삭제 | 앱 내 삭제 + **웹에서도 삭제 요청할 수 있는 URL**을 Play Console "데이터 보안"에 등록. 로그인 앱 필수 | - |
| 데이터 보안 양식 | 수집/공유 항목, 암호화 여부, 삭제 요청 방법. SDK(Firebase, 광고) 수집 항목 포함. 실제와 다르면 정책 위반 삭제 | 제출 때마다 |
| 개발자 확인 | 조직은 D-U-N-S, 개인은 신분증 + 주소 + 전화. 개발자 주소/이메일이 스토어에 공개됨 | 계정 생성 |
| 앱 서명 | **Play App Signing** 사용(업로드 키 따로, 서명 키는 Google 보관). 업로드 키 분실 시 리셋 요청 가능. `.aab` 형식만 | 첫 업로드 |
| 콘텐츠 등급 | IARC 설문. 미완료면 게시 불가 | - |
| 앱 액세스 | 로그인 앱은 "앱 액세스" 섹션에 데모 계정과 진입 방법 | 제출 때마다 |
| 광고 ID | `AD_ID` 권한 선언 여부와 데이터 보안 양식의 광고 ID 항목 일치 | - |
| 권한 선언 | 백그라운드 위치, SMS/통화 기록, 전체 파일 접근, 접근성 서비스는 별도 양식 + 영상. 사진은 **Photo Picker** 사용이 기본, `READ_MEDIA_IMAGES`는 핵심 기능일 때만 | 권한 추가 시 |
| 16KB 페이지 | API 35+이고 네이티브 코드(.so)가 있으면 16KB 페이지 크기 지원 (2027-02-01부터). RN/Flutter는 최신 버전이면 대응됨 | 2027 |
| 패키지 등록 | 개발자 확인 + 패키지명 등록 의무 확대 중 (일부 국가 2026-09-30부터). 한국 적용 시점은 공식 페이지 확인 | 확인 필요 |
| 뉴스/건강/금융 | 카테고리별 추가 선언 양식. 정신 건강 데이터를 다루는 앱은 "건강" 선언 대상인지 확인 | 카테고리 결정 시 |

### Google 리젝 상위 사유

데이터 보안 양식 불일치, 계정 삭제 URL 누락, 앱 액세스 정보 누락, 권한 과다(사진 전체 접근), 개인정보처리방침 URL 불량, 스크린샷/설명 정책(다른 앱 이름 언급, 순위 주장), 비공개 테스트 요건 미달.

---

## 4. 한국 법규 (상세 표)

| 항목 | 해당 조건 | 해야 할 것 |
|---|---|---|
| 개인정보처리방침 | 개인정보를 하나라도 수집 | 개인정보보호법 제30조 필수 기재 항목: 수집 항목/목적/보유 기간, 제3자 제공, 처리 위탁(클라우드, 분석 SDK 포함), 파기 절차, 정보주체 권리(열람/정정/삭제/처리정지)와 행사 방법, 안전성 확보 조치, 개인정보 보호책임자 이름/연락처, 변경 고지. `templates/privacy-policy-outline.md` |
| 만 14세 미만 | 아동이 가입 가능 | 법정대리인 동의 절차. 대상이 아니면 가입 시 "만 14세 이상" 확인 |
| 위치정보 | 위치를 수집/이용 | 위치정보법: 앱 사용 중 단순 이용은 "위치기반서비스사업 신고"(방송통신위원회) 대상인지 검토. 이용약관에 위치정보 조항. 확실하지 않으면 KISA 위치정보 가이드 확인 |
| 유료 결제 | 결제가 있음 | 통신판매업 신고(구청/온라인), 사업자등록. 앱 설명과 약관에 청약철회/환불 규정 |
| 청소년 보호 | UGC 또는 성인 콘텐츠 가능성 | 청소년보호책임자 지정(일정 규모 이상), 청소년 보호 정책 게시 |
| 게임 | 게임물이면 | 게임물관리위원회 등급분류(자체등급분류 사업자인 스토어 통해 가능) |
| 이용약관 | 서비스 제공 | 전자상거래법/약관규제법. 앱 내 동의 화면 + 스토어 EULA 링크 |

이 표는 법률 자문이 아니다. 유료 결제나 위치 수집이 있으면 제출 전에 한 번은 전문가나 KISA/방통위 안내를 확인한다.

---

## 5. 키와 설정 파일 만들기 (상세)

전부 만들고 나면 `templates/release-checklist.md`의 "파일" 절이 전부 체크되어야 한다. **비밀 파일은 절대 커밋하지 않는다** (`templates/gitignore-secrets.txt`).

### 5-1. 식별자 정하기 (바꾸면 새 앱이 된다)

- iOS `bundleIdentifier`와 Android `package`는 역도메인(`com.example.myapp`). 둘을 같게 맞춘다.
- 한 번 스토어에 올리면 못 바꾼다. 회사 도메인이 없으면 개인 도메인이나 `io.github.<id>`.
- 버전: `version`(사용자에게 보임, 1.0.0) + `ios.buildNumber` / `android.versionCode`(정수, 업로드마다 증가). EAS는 `autoIncrement`로 자동.

### 5-2. Apple

| 파일/키 | 만드는 곳 | 용도 | 보관 |
|---|---|---|---|
| Distribution Certificate + Provisioning Profile | EAS가 자동 생성(`eas credentials`) 또는 Apple Developer 포털 | 빌드 서명 | EAS 서버. 로컬 `credentials.json`은 커밋 금지 |
| App Store Connect API Key (`.p8`, Key ID, Issuer ID) | App Store Connect > 사용자 및 액세스 > 통합 > API 키 (App Manager 권한) | `eas submit`, CI 자동 제출 | `.p8`은 한 번만 다운로드 가능. 비밀 저장소에 |
| APNs Key (`.p8`) | Apple Developer > Keys | 푸시 | 계정당 2개 제한. 만료 없음 |
| `PrivacyInfo.xcprivacy` | 프로젝트에 파일 추가 (`templates/PrivacyInfo.xcprivacy`) | Required Reason API, 수집 데이터 선언 | 커밋 |
| `GoogleService-Info.plist` | Firebase 콘솔 | Firebase | 커밋해도 되지만(공개 키) 관행상 비밀로 |
| App ID 등록 | Apple Developer > Identifiers | Sign in with Apple, Push 등 capability 켜기 | - |

Expo `app.json`의 `ios.infoPlist`에 권한 문자열과 `ITSAppUsesNonExemptEncryption`을 넣는다. 예시는 `templates/app.config.example.ts`.

### 5-3. Google

| 파일/키 | 만드는 곳 | 용도 | 보관 |
|---|---|---|---|
| 업로드 키스토어 (`.jks`) | EAS 자동 생성 또는 `keytool` (아래 명령) | `.aab` 서명 | EAS 서버 또는 비밀 저장소. **분실 시 Play 지원에 리셋 요청** |
| Play App Signing | Play Console > 앱 무결성 > 첫 업로드 때 활성화 | 배포 서명 키를 Google이 보관 | - |
| 서비스 계정 JSON | Google Cloud 콘솔 > 서비스 계정 생성 > 키(JSON) > Play Console > 사용자 및 권한에서 초대 + "릴리스 관리" 권한 | `eas submit --platform android` | 커밋 금지 |
| `google-services.json` | Firebase 콘솔 | Firebase | 관행상 비밀 |
| SHA-1 / SHA-256 지문 | `keytool -list -v` 또는 Play Console > 앱 서명 페이지 | Firebase Auth, 구글/카카오 로그인 등록 | **업로드 키 지문과 Play 서명 키 지문 둘 다** 등록. 하나만 하면 프로덕션에서 로그인이 깨진다 |

```bash
# 업로드 키스토어 직접 만들 때 (EAS에 맡기면 불필요)
keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
# 지문 확인
keytool -list -v -keystore upload-keystore.jks -alias upload
```

### 5-4. 소셜 로그인 키

| 제공자 | 필요한 것 | 등록할 곳 |
|---|---|---|
| Google | OAuth 클라이언트 ID (iOS용, Android용 각각 + 웹용) | Google Cloud 콘솔. Android는 패키지명 + SHA-1 두 개(업로드/Play 서명) |
| Apple | Services ID, Key(`.p8`), Team ID | Apple Developer. 서버 검증용 |
| Kakao | 네이티브 앱 키, REST API 키 | Kakao Developers. 플랫폼에 번들 ID/패키지명 + 키 해시(Android) 등록 |
| Naver | Client ID/Secret | Naver Developers. 앱 이름/로고 심사 있음 |

키 해시와 SHA 지문은 **디버그, 업로드, Play 서명 키 세 벌**을 모두 등록한다. "개발 중엔 되는데 스토어 버전에서 로그인 안 됨"의 원인 1위다.

### 5-5. 설정 파일

| 파일 | 템플릿 | 내용 |
|---|---|---|
| `app.config.ts` | `templates/app.config.example.ts` | 식별자, 버전, 권한 문자열, 아이콘/스플래시, 플러그인, `blockedPermissions` |
| `eas.json` | `templates/eas.json.example` | build 프로필(development/preview/production), submit 프로필(ASC API 키, 서비스 계정, track) |
| `PrivacyInfo.xcprivacy` | `templates/PrivacyInfo.xcprivacy` | Apple Privacy Manifest |
| `.env` | `templates/env.example` | 공개 가능한 키만 `EXPO_PUBLIC_*`. 서버 비밀은 앱에 넣지 않는다 |
| `.gitignore` 추가분 | `templates/gitignore-secrets.txt` | `.jks`, `.p8`, 서비스 계정 JSON, `credentials.json`, `.env` |
| 심사 노트 | `templates/review-notes.md` | 데모 계정, 기능 설명, 외부 서비스 목록. 양쪽 스토어 공통으로 쓴다 |
| 개인정보처리방침 | `templates/privacy-policy-outline.md` | 한국 법 필수 항목 + 스토어 요구 항목. 웹에 게시하고 앱 설정에서 링크 |
| 스토어 등록 정보 | `templates/store-listing.md` | 이름, 부제, 설명, 키워드, 스크린샷 규격, 카테고리, 연령, URL |

---

## 6. 제출 순서 (보충)

Apple 심사는 보통 24~48시간, Google은 첫 앱이 길게는 7일. 두 스토어를 **같은 빌드로 동시에** 제출하고, 심사 중에는 백엔드를 내리지 않는다.

---

## 7. 하지 말 것 (이유 포함)

- 계정 삭제를 "고객센터로 문의"로 대체하는 것. 양쪽 다 리젝.
- 개인정보처리방침을 노션 공개 페이지나 구글 문서로 두는 것. 접속은 되지만 "앱 이름/수집 항목 불일치"로 걸리고, URL이 바뀌면 리젝. 정적 페이지로 직접 호스팅.
- 데이터 수집 선언에서 SDK를 빼먹는 것. Firebase/광고 SDK가 있으면 "수집 안 함"은 거짓 선언이고 나중에 앱 삭제 사유가 된다.
- 심사 노트에 "일반적인 앱입니다"만 쓰는 것.
- 소셜 로그인만 넣고 Apple 로그인을 빼는 것.
- 디지털 상품을 외부 결제로 파는 것. 계정 정지까지 간다.
- 스크린샷에 앱에 없는 기능이나 "1위" 같은 주장을 넣는 것.
- 업로드 키스토어를 로컬 한 곳에만 두는 것. EAS나 비밀 저장소에 사본.
- 소셜 로그인 지문을 디버그 키만 등록하는 것.
- 비밀 키(`.p8`, `.jks`, 서비스 계정 JSON)를 커밋하는 것. 한 번 올라가면 재발급 외에 방법이 없다.
- Google 비공개 테스트 중 트랙을 중지하는 것. 14일이 처음부터 다시 시작된다.
- 정책 날짜를 이 문서만 믿는 것. 제출 전 참고 절의 공식 페이지를 연다.

---

## 참고

- Apple - Upcoming requirements (SDK 최소 버전, 연령 등급, 트레이더): https://developer.apple.com/news/upcoming-requirements/
- Apple - App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple - Account deletion (5.1.1(v)): https://developer.apple.com/news/?id=12m75xbj
- Apple - Privacy manifest / Required reason API: https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
- Google - Developer Program Policy (한국어): https://support.google.com/googleplay/android-developer/answer/17190352?hl=ko
- Google - Target API level 요건: https://support.google.com/googleplay/android-developer/answer/11926878
- Google - 개인 계정 비공개 테스트 요건 (12명/14일, 2023-11-13 이후 계정): https://www.testerscommunity.com/blog/google-play-closed-testing-requirements-2026
- Google - 2026 정책 일정 정리 (API 36 2026-08-31, 16KB 2027-02-01): https://primetestlab.com/blog/google-play-policy-updates-2026
- Expo - App credentials: https://docs.expo.dev/app-signing/app-credentials/
- Expo - EAS Submit: https://docs.expo.dev/submit/introduction/
- Expo - eas.json 스키마 (submit 필드명 확인): https://docs.expo.dev/eas/json/
- 개인정보보호위원회 - 개인정보처리방침 작성 지침: https://www.pipc.go.kr/
- KISA - 위치정보 사업 안내: https://www.kisa.or.kr/
- `spring-auth` 스킬 - 백엔드 쪽 계정 삭제, 소셜 로그인 서버 검증
