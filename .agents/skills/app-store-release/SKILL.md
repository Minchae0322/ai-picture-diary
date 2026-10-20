---
name: app-store-release
description: 모바일 앱을 App Store와 Google Play에 처음 등록하거나 심사 리젝을 받았을 때. 두 스토어의 심사 필수 조건(계정 삭제, 개인정보처리방침, 데모 계정, 권한 사유, 결제 규칙, 테스트 트랙 등)과 한국 법규 항목을 한 번에 점검하고, 서명 키·API 키·서비스 계정·app.json/eas.json·Privacy Manifest 같은 설정 파일을 만들어 원스톱으로 제출까지 간다. "앱 등록", "스토어 심사", "리젝", "keystore", "eas submit", "개인정보처리방침" 요청에 사용.
---

# 앱 스토어 등록 (app-store-release)

## 목적
두 스토어 + 한국 법규를 한 체크리스트로 점검하고, 키와 설정 파일을 빠짐없이 만들고, 제출 순서를 정해 한 번에 통과한다. 리젝 사유의 대부분은 코드가 아니라 **누락된 선언, 없는 화면, 빠진 URL**이다.
기준 시점 **2026-09 확인.** 날짜가 붙은 항목은 제출 전 공식 페이지(`reference.md` 참고 절)에서 재확인. 기본 스택은 Expo(React Native) + EAS Build/Submit. Flutter/네이티브도 체크리스트는 동일, 설정 파일 절만 해당 도구로 읽는다.

## 언제 적용
앱 첫 등록(개발자 계정부터) / 리젝 사유 해석 / 새 권한, 로그인, 결제, AI 기능 추가로 재심사 / 서명 키, 서비스 계정, API 키 신규 생성 또는 분실.


> 앱 **코드** 규칙은 `expo-app-conventions`. 여기는 제출과 심사만 다룬다.
## 0. 시작 전 결정 (채우면 해당 없는 항목을 걸러낸다)
| 결정 | 선택지 | 기준 |
|---|---|---|
| Apple 계정 | 개인 / 조직 | 조직은 D-U-N-S 필요(1~2주). 개인은 본명 노출. 연 99 USD |
| Google 계정 | 개인 / 조직 | 개인(2023-11-13 이후 생성)은 **비공개 테스트 12명 x 14일** 필수, 조직 면제. 일회 25 USD. 조직은 D-U-N-S |
| 로그인 | 없음 / 자체 / 소셜 | 소셜(구글, 카카오, 네이버)이면 Apple **Sign in with Apple 또는 동급 옵션** 필수(4.8). 로그인 있으면 **계정 삭제** + **데모 계정** 필수 |
| 결제 | 없음 / 인앱 / 외부 | 디지털 콘텐츠(구독, 테마, 코인)는 **인앱 결제 강제**. 실물/서비스는 외부 PG 가능. 헷갈리면 인앱 |
| UGC | 있음 / 없음 | 커뮤니티, 댓글, 프로필 이미지가 있으면 **신고, 차단, 필터링, 약관 동의** 4종 필수 |
| 위치 | 없음 / 사용 중 / 백그라운드 | 백그라운드는 양쪽 별도 심사 + 영상. 한국은 위치기반서비스 사업자 신고 검토 |
| 대상 연령 | 전체 / 청소년 / 성인 | 아동 대상이면 Google Families, Apple Kids 규제 대폭 증가. 처음엔 피한다 |
| 배포 국가 | 한국만 / 글로벌 | EU 포함 시 DSA 트레이더 상태(주소, 연락처 공개) 필요. 처음엔 한국 + 필요한 나라만 |

## 1. 두 스토어 공통 필수 (하나라도 없으면 리젝)
- 앱 안에서 개인정보처리방침 링크가 열린다(설정 등). 스토어 URL만으로는 부족.
- 로그인 앱: 앱 안에서 사용자가 직접 계정 삭제(확인 1~2단계 허용). 백엔드에서 실제 삭제/익명화, 법적 보관 의무만 예외. 로그인 없이 볼 수 있는 화면 또는 심사 노트에 데모 계정.
- 모든 화면 완성. "준비 중", lorem ipsum, 빈 탭, 죽은 링크 하나라도 있으면 Apple 2.1 리젝. 크래시 없음, 오프라인/느린 네트워크 에러 화면(심사자는 실기기 + 나쁜 네트워크).
- 권한 요청 직전에 이유. iOS `NS*UsageDescription` 구체적으로("사진을 업로드하기 위해"), Android는 위험 권한 전 설명 UI.
- UGC: 신고 버튼, 차단, 부적절 콘텐츠 필터(최소 금칙어), 약관 동의 화면, 24시간 내 처리 안내. AI 생성: AI 생성물 표시, 신고/필터 적용, 건강/법률/금융 조언처럼 보이면 면책 문구.
- 등록 페이지: 개인정보처리방침 URL(HTTPS, 실제 접속, 앱 이름/수집 항목 일치), 지원 URL 또는 이메일(실제 응답), 실제 앱 화면 스크린샷(프레임 합성 허용, 없는 기능 리젝), 다른 플랫폼 언급 금지(Apple), 연령 등급 설문 정직하게(변경 시 재심사).
- 데이터 수집 선언(Apple 라벨, Google 데이터 보안)이 **실제 SDK 동작과 일치**. Firebase Analytics, 광고 SDK, 크래시 리포터가 있으면 "수집 안 함" 금지.

## 2. Apple App Store 전용
| 항목 | 핵심 |
|---|---|
| 빌드 도구 | **Xcode 26 + iOS 26 SDK** 빌드만 접수(2026-04-28부터). 매년 4월 갱신 |
| Privacy Manifest | `PrivacyInfo.xcprivacy`에 수집 유형, 추적 도메인, **Required Reason API 사유**. 서드파티 SDK도 각자 필요(2024-05-01부터) |
| 개인정보 라벨 | App Store Connect 설문. Privacy Manifest와 일치 |
| 4.8 로그인 | 서드파티 로그인 제공 시 Sign in with Apple **또는** 이름/이메일만 수집하고 추적 안 하는 동급 옵션 |
| 5.1.1(v) 계정 삭제 | 앱 내 삭제. 2022-06-30부터 |
| 2.1 완성도 / 데모 | 로그인 앱은 심사 노트에 **동작하는 데모 계정**. 백엔드는 심사 내내 살아 있어야 함 |
| 2.3.1 심사 노트 | 새 기능, 외부 서비스(인증, 결제, AI), 테스트 방법을 구체적으로. "일반 앱입니다"는 리젝 사유 |
| ATT | 광고 ID/크로스앱 추적 시 `NSUserTrackingUsageDescription` + `ATTrackingManager`. 안 하면 라벨 "추적 안 함" |
| 수출 규정 | HTTPS만 쓰면 `ITSAppUsesNonExemptEncryption = false` |
| 연령 등급 | 2026-01-31부터 새 설문. 기존 앱도 답변 갱신 |
| EU 트레이더 | EU 배포 시 트레이더 상태 없으면 내려감(2025-02-17부터) |
| 스크린샷 | 6.9" iPhone 필수, iPad 지원 시 13" iPad 필수 |
| 인앱 결제 | 디지털 상품은 StoreKit. 외부 결제 링크/문구 금지(한국 대안 결제 신청 가능하나 첫 출시엔 피함) |

## 3. Google Play 전용
| 항목 | 핵심 |
|---|---|
| Target API | **API 36(Android 16)** 이상(2026-08-31부터). 매년 8월 말 1씩 오름 |
| 비공개 테스트 | 개인 계정(2023-11-13 이후): **12명이 14일 연속 옵트인** 후 프로덕션 신청(10문항). 실제 사용 기록 필요. 14~16명 모집. 트랙 중지 시 타이머 리셋 |
| 계정 삭제 | 앱 내 삭제 + **웹 삭제 요청 URL**을 "데이터 보안"에 등록. 로그인 앱 필수 |
| 데이터 보안 양식 | 수집/공유, 암호화, 삭제 방법. SDK 포함. 실제와 다르면 정책 위반 삭제 |
| 개발자 확인 | 조직 D-U-N-S, 개인 신분증 + 주소 + 전화. 주소/이메일 공개됨 |
| 앱 서명 | **Play App Signing**(업로드 키 별도, 서명 키 Google 보관). 업로드 키 분실 시 리셋 요청. `.aab`만 |
| 콘텐츠 등급 | IARC 설문. 미완료면 게시 불가 |
| 앱 액세스 | 로그인 앱은 데모 계정과 진입 방법 |
| 광고 ID | `AD_ID` 권한 선언과 데이터 보안 양식 일치 |
| 권한 선언 | 백그라운드 위치, SMS/통화, 전체 파일, 접근성은 별도 양식 + 영상. 사진은 **Photo Picker** 기본, `READ_MEDIA_IMAGES`는 핵심 기능만 |
| 16KB 페이지 | API 35+ 네이티브 코드(.so)는 16KB 페이지 지원(2027-02-01부터). RN/Flutter 최신이면 대응 |
| 패키지 등록 | 개발자 확인 + 패키지명 등록 의무 확대 중(일부 국가 2026-09-30부터). 한국 시점은 공식 페이지 확인 |
| 뉴스/건강/금융 | 카테고리별 추가 선언. 정신 건강·의료 데이터를 다루면 "건강" 대상인지 확인 |

## 4. 한국 법규 (스토어와 별개. 법률 자문 아님, 유료 결제/위치 수집 시 전문가나 KISA/방통위 확인)
- 개인정보처리방침: 개인정보 수집 시 개인정보보호법 제30조 필수 항목. `templates/privacy-policy-outline.md`
- 만 14세 미만 가입 가능: 법정대리인 동의. 아니면 가입 시 "만 14세 이상" 확인
- 위치정보: 위치정보법. 위치기반서비스사업 신고(방통위) 대상인지 검토, 약관에 위치정보 조항
- 유료 결제: 통신판매업 신고, 사업자등록, 청약철회/환불 규정
- 청소년 보호: UGC/성인 콘텐츠 가능성 시 청소년보호책임자 지정, 보호 정책 게시
- 게임: 게임물관리위원회 등급분류. 이용약관: 전자상거래법/약관규제법, 앱 내 동의 화면 + 스토어 EULA 링크

## 5. 키와 설정 파일 (완료 시 `templates/release-checklist.md` "파일" 절 전부 체크. 비밀 파일은 절대 커밋 금지)
- 식별자: iOS `bundleIdentifier` = Android `package`, 역도메인(`com.example.myapp`). 한 번 올리면 못 바꾼다. 도메인 없으면 `io.github.<id>`. `version`(1.0.0) + `ios.buildNumber`/`android.versionCode`(업로드마다 증가, EAS `autoIncrement`).
- Apple: Distribution Certificate + Provisioning Profile, App Store Connect API Key(`.p8`, Key ID, Issuer ID), APNs Key(`.p8`), `PrivacyInfo.xcprivacy`, `GoogleService-Info.plist`, App ID 등록(capability). `app.json`의 `ios.infoPlist`에 권한 문자열과 `ITSAppUsesNonExemptEncryption`.
- Google: 업로드 키스토어(`.jks`), Play App Signing 활성화, 서비스 계정 JSON("릴리스 관리" 권한), `google-services.json`, SHA-1/SHA-256 지문(**업로드 키 + Play 서명 키 둘 다**).
- 소셜 로그인: Google OAuth 클라이언트 ID(iOS/Android/웹), Apple Services ID + Key(`.p8`) + Team ID, Kakao 네이티브 앱 키 + REST API 키, Naver Client ID/Secret. 키 해시/SHA 지문은 **디버그, 업로드, Play 서명 세 벌** 등록.
- 설정 파일: 아래 "이 스킬 폴더의 파일" 표. `.env`는 `EXPO_PUBLIC_*`만, 서버 비밀은 앱에 넣지 않는다.

## 6. 제출 순서 (원스톱)
1. 0장 결정표 채우기 -> 해당 없는 체크 항목 제거
2. 계정: Apple Developer / Google Play Console 가입 + 개발자 확인 (개인 계정이면 12명 테스터 모집 시작)
3. 식별자 확정, app.config.ts / eas.json 작성, .gitignore 갱신
4. 키 생성: EAS credentials(iOS/Android), ASC API 키, Play 서비스 계정, 소셜 로그인 키 3벌 지문 등록
5. 앱 안 필수 화면: 개인정보처리방침 링크, 계정 삭제, 약관 동의, (UGC면) 신고/차단
6. 개인정보처리방침 웹 게시(HTTPS). 계정 삭제 웹 URL 준비(Google용)
7. PrivacyInfo.xcprivacy 작성, 권한 문자열 점검, 불필요 권한 blockedPermissions
8. `eas build --profile production --platform all`
9. 내부 테스트: TestFlight / 내부 테스트 트랙에 올리고 실기기 + 나쁜 네트워크로 1장 전부 확인
10. 스토어 등록 정보: store-listing.md 기준. 개인정보 라벨 / 데이터 보안 양식 / 연령 등급 / 앱 액세스(데모 계정)
11. Google 개인 계정: 비공개 테스트 트랙 게시 -> 14일 -> 프로덕션 접근 신청(10문항)
12. 심사 노트 작성(review-notes.md), 제출. 두 스토어를 **같은 빌드로 동시에**, 심사 중 백엔드를 내리지 않는다 (Apple 24~48시간, Google 첫 앱 최대 7일)
13. 리젝 시: 가이드라인 번호로 2~3장에서 찾고, 고친 뒤 노트에 "무엇을 어떻게 고쳤는지" 적어 재제출. 이의 제기는 사유가 명백히 틀렸을 때만

## 7. 하지 말 것
- 계정 삭제를 "고객센터 문의"로 대체. 개인정보처리방침을 노션/구글 문서로 두기(정적 페이지 직접 호스팅). 데이터 수집 선언에서 SDK 빼먹기.
- 심사 노트에 "일반적인 앱입니다"만 쓰기. 소셜 로그인만 넣고 Apple 로그인 빼기. 디지털 상품을 외부 결제로 팔기(계정 정지까지). 스크린샷에 없는 기능이나 "1위" 주장.
- 업로드 키스토어를 로컬 한 곳에만 두기. 소셜 로그인 지문을 디버그 키만 등록. 비밀 키(`.p8`, `.jks`, 서비스 계정 JSON) 커밋.
- Google 비공개 테스트 중 트랙 중지(14일 리셋). 정책 날짜를 이 문서만 믿기.

## 정책 변경 기록 (계속 추가)
정책이 바뀌거나 리젝을 겪을 때마다 한 줄씩 쌓는다. 본문은 "현재 규칙"만 유지하고, 언제 무엇이 바뀌었는지는 이 표가 기억한다. 리젝 사유는 가이드라인 번호와 함께 적는다.

| 일자 | 스토어 | 변경/사유 | 본문 반영 위치 | 출처 |
|---|---|---|---|---|
| 2026-09-08 | 공통 | 최초 작성. Apple Xcode 26 필수(04-28~), Google API 36(08-31~), 개인 계정 12명/14일 | 2, 3장 | 참고 절 링크 |
| | | | | |

리젝 기록 형식 예: `2026-10-02 | Apple | 5.1.1(v) 계정 삭제 버튼이 3단계 깊이라 "쉽게 접근 불가" 판정 | 1장 계정 삭제 항목에 "설정 1단계 안" 추가 | 리젝 메일`

## 이 스킬 폴더의 파일
| 파일 | 템플릿 | 내용 |
|---|---|---|
| `app.config.ts` | `templates/app.config.example.ts` | 식별자, 버전, 권한 문자열, 아이콘/스플래시, 플러그인, `blockedPermissions` |
| `eas.json` | `templates/eas.json.example` | build 프로필(development/preview/production), submit 프로필(ASC API 키, 서비스 계정, track) |
| `PrivacyInfo.xcprivacy` | `templates/PrivacyInfo.xcprivacy` | Apple Privacy Manifest |
| `.env` | `templates/env.example` | 공개 가능한 키만 `EXPO_PUBLIC_*` |
| `.gitignore` 추가분 | `templates/gitignore-secrets.txt` | `.jks`, `.p8`, 서비스 계정 JSON, `credentials.json`, `.env` |
| 심사 노트 | `templates/review-notes.md` | 데모 계정, 기능 설명, 외부 서비스 목록. 양쪽 공통 |
| 개인정보처리방침 | `templates/privacy-policy-outline.md` | 한국 법 필수 항목 + 스토어 요구 항목. 웹 게시 후 앱에서 링크 |
| 스토어 등록 정보 | `templates/store-listing.md` | 이름, 부제, 설명, 키워드, 스크린샷 규격, 카테고리, 연령, URL |
| 제출 체크리스트 | `templates/release-checklist.md` | 파일/화면/등록 정보 점검 |

관련 스킬: `spring-auth`(백엔드 계정 삭제, 소셜 로그인 서버 검증), `notification`(푸시 권한 고지, APNs 키·FCM 설정, 광고성 알림 동의), `file-upload-storage`(사진 권한과 업로드)

## 더 보기
- 이유, 예시, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
