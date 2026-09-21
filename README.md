# AI 감정 날씨일기 (젤리 다이어리)

하루 한 줄을 쓰면 AI가 감정을 날씨로 판정하고 그림으로 그려 주는 모바일 일기 앱.

```
api/   Spring Boot 3.5 / Java 21 / PostgreSQL
app/   Expo SDK 56 / React Native / TypeScript
sql/   마이그레이션 SQL (실행은 사람이)
docs/  화면·API·DB 문서
```

## 지금 되는 것

화면 02(기록) → 03(AI 생성 중) → 04(결과)의 핵심 루프. 나머지 7화면은 문서와 자리표시자만 있다.
AI는 규칙 기반 대역(`MockDiaryPainter`)이며 실제 모델은 다음 라운드.

## 시작하기

```bash
# 1. DB 준비 (사람이 실행)
psql -f sql/patch/2026-09-21-diary-테이블-추가.sql

# 2. 백엔드
cd api
gradle wrapper            # 최초 1회 (wrapper 미포함)
./gradlew test
DB_URL=jdbc:postgresql://localhost:5432/jellydiary DB_USERNAME=jelly DB_PASSWORD=jelly ./gradlew bootRun

# 3. 앱 (app/INSTALL.md 참고)
cd ../app && npm install && npx expo install --fix && npm run start
```

문서: `docs/screen/README.md`(화면), `docs/api/`(API 명세), `CLAUDE.md`(작업 규칙)
