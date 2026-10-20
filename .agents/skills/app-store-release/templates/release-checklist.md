# 출시 체크리스트

## 결정 (0장)
- [ ] Apple 계정 유형, Google 계정 유형 (개인이면 테스터 12명 확보)
- [ ] 로그인 / 결제 / UGC / 위치 / 대상 연령 / 배포 국가 결정

## 파일
- [ ] app.config.ts: bundleIdentifier = package, 버전, 권한 문자열, blockedPermissions, ITSAppUsesNonExemptEncryption
- [ ] eas.json: production 빌드 프로필, submit 프로필 (ASC API 키, 서비스 계정, track)
- [ ] PrivacyInfo.xcprivacy
- [ ] .env / .env.example, .gitignore에 비밀 파일 추가
- [ ] EAS credentials 생성 (iOS 인증서/프로파일, Android 키스토어)
- [ ] App Store Connect API 키 (.p8) 다운로드, 비밀 저장소 보관
- [ ] Play 서비스 계정 JSON, Play Console 권한 부여
- [ ] 소셜 로그인 키: 디버그/업로드/Play 서명 지문 3벌 등록
- [ ] google-services.json / GoogleService-Info.plist (Firebase 사용 시)

## 앱 안 (1장)
- [ ] 개인정보처리방침 링크 (설정)
- [ ] 계정 삭제 화면 + 백엔드 실제 삭제
- [ ] 이용약관 동의
- [ ] (UGC) 신고, 차단, 필터, 약관
- [ ] (AI) 생성물 표시, 면책
- [ ] 권한 요청 전 설명
- [ ] 빈 상태/오류/오프라인 화면
- [ ] "준비 중" 화면 없음
- [ ] 다른 플랫폼 언급 없음

## 웹
- [ ] 개인정보처리방침 HTTPS 게시
- [ ] 계정 삭제 안내 페이지 (Google)
- [ ] 지원 페이지 또는 이메일

## Apple (2장)
- [ ] Xcode 26 / iOS 26 SDK 빌드
- [ ] 개인정보 라벨 = PrivacyInfo = 처리방침
- [ ] 4.8: 소셜 로그인 시 Apple 로그인
- [ ] 심사 노트 + 데모 계정
- [ ] 연령 등급 설문
- [ ] 6.9" 스크린샷 (+ iPad 13")
- [ ] TestFlight로 실기기 확인

## Google (3장)
- [ ] targetSdk 36+
- [ ] 데이터 보안 양식 = 처리방침
- [ ] 계정 삭제 URL 등록
- [ ] 앱 액세스 데모 계정
- [ ] 콘텐츠 등급 설문
- [ ] 광고 ID 선언 일치
- [ ] 내부 테스트 -> (개인 계정) 비공개 테스트 12명 14일 -> 프로덕션 신청
- [ ] Play App Signing 활성화, 업로드 키 백업

## 한국 (4장)
- [ ] 개인정보처리방침 필수 항목 15개 점검
- [ ] 만 14세 미만 처리
- [ ] (위치) 위치기반서비스 신고 검토
- [ ] (결제) 통신판매업 신고, 환불 규정
- [ ] (UGC) 청소년 보호 정책

## 제출 후
- [ ] 백엔드 심사 기간 내내 유지
- [ ] 리젝 시 가이드라인 번호로 원인 찾고 노트에 수정 내용 명시
- [ ] 출시 후 크래시 대시보드 첫 48시간 감시
