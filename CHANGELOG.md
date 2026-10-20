# 변경 기록

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), 버전은 [SemVer](https://semver.org/lang/ko/).

## [Unreleased]

### Added
- **오늘의 기분을 고르지 않으면 그릴 수 없다** (ADR `docs/adr/2026-10-20-기분-선택-필수와-본문-200자.md`)
  - `userHint` 가 선택에서 **필수**로. 도메인이 `DIARY_EMOTION_REQUIRED`(400)로 거절하고
    요청 DTO 는 `@NotNull` 로 끊는다. 사유가 본문 길이 위반과 달라 **코드도 따로 뒀다** -
    뭉개면 앱이 "기분을 먼저 골라 주세요"를 띄울 근거를 잃는다
  - **필수가 됐어도 AI 판정을 대체하지 않는다.** 결과의 `emotion` 은 여전히 서버가 정하고
    고른 값과 다를 수 있다. 칸이 둘인 이유가 그것이다
  - 02 가 **두 단계**를 드러낸다 - 1 오늘의 기분, 2 오늘 한 줄. 단계 머리의 번호 동그라미는
    `SketchBorder` 로 그린 손그림 원이고 끝낸 단계는 체크로 바뀐다(`Icon` 에 `check` 추가)
  - 비활성 버튼 아래에 **무엇이 비었는지** 한 줄로 쓴다. 한 번에 하나만 - 흐린 버튼만 두면 고장으로 읽힌다
- **`NotePaper`** (`app/src/shared/ui/`) - 색연필 괘선이 그어진 공책 한 장. 02 의 쓰는 자리가 됐다.
  괘선은 1px `View` 가 아니라 `SketchLine` 이고, **괘선 간격과 글줄 높이가 같은 값(28)**이라
  글자가 줄 위에 앉는다. 네 줄로 시작해 일곱 줄까지 자란다. `hand-drawn-ui` 5장의
  `NotebookBackground` 가 설계에서 구현으로 넘어왔다(구현 8종 / 설계 13종)
- **로그인 없이 쓰는 게스트 모드** (ADR `docs/adr/2026-10-20-로그인-없이-쓰는-게스트-모드.md`)
  - 앱이 기기에서 UUID 를 만들어(`expo-crypto`) 안전 저장소에 두고(`expo-secure-store`)
    `POST /api/v1/guest/devices` 로 사용자 번호를 받는다. **그 뒤는 지금과 똑같다** -
    일기·캘린더·그래프·뱃지·연속 기록이 서버 코드 그대로 돈다
  - **로그인해도 사용자 번호가 바뀌지 않는다.** 그 번호에 소셜 계정이 연결될 뿐이라
    로그인 시 기록을 옮기거나 합치는 규칙이 아예 없다 - 게스트 모드에서 가장 비싼 부분을 설계로 없앴다
  - 서버는 기기 UUID 원문을 저장하지 않는다. SHA-256 만 둔다(`tb_guest_device.device_hash`)
  - **게스트인지 아닌지는 `tb_profile.role`(`GUEST`/`MEMBER`)이 들고 있다.** 처음에는 기기 행의 존재로
    판단했는데 그건 결함이었다 - 로그인해도 사용자 번호가 바뀌지 않으므로 기기 행이 남아
    영원히 게스트로 읽힌다. 권한을 계정 쪽에 두니 승격이 `Profile.promote()` 한 줄이 됐다
  - 로그인 벽 네 곳(07 뱃지 · 08 커뮤니티 · 09 상점 · 10 마이페이지). 탭은 열리고 그 위에 시트가 올라온다 -
    뒤에 무엇이 있는지 보여야 로그인할 이유가 생긴다. **인증이 아직 없어 시트에 "그냥 둘러보기"가 함께 있다**
  - 커뮤니티 쓰기(공유·좋아요·신고)는 서버도 막는다(403 `COMMON_LOGIN_REQUIRED`).
    화면이 유일한 방어선이면 방어선이 아니다. 읽기는 막지 않는다
  - 비로그인 AI 생성은 하루 2회(최초 1 + 다시 그리기 1). 상한 초과는 `DIARY_GUEST_GENERATE_LIMIT` 로
    따로 돌려준다 - 로그인 사용자와 사유가 달라 앱이 띄울 문구가 다르다.
    **일기 건수는 그대로 하루 1건**이다(unique 인덱스와 캘린더의 하루 한 칸이 그 위에 서 있다)
  - 새 테이블 `tb_guest_device` + `tb_profile.role` 컬럼 - `sql/patch/2026-10-20-*.sql` 둘. **실행 전이다**
  - 광고를 보면 횟수를 더 주는 것은 다음 라운드다. 리워드 광고 SDK 는 Expo Go 에서 돌지 않아
    개발 빌드가 필요하고, 광고 식별자는 iOS 추적 동의와 개인정보처리방침 갱신을 함께 끌고 온다

### Changed
- **본문 상한 500자 -> 200자** (`app.diary.max-content-length`, 같은 ADR).
  화면의 약속("하루 한 줄")과 상한이 어긋나 있었고, 길수록 감정이 섞여 9종 판정이 흐려진다.
  **DB 컬럼은 varchar(500) 그대로** - 업무 상한만 내렸으므로 마이그레이션이 없다
- 02 의 전송이 알약 입력창 안의 "기록"에서 **화면 폭을 쓰는 "오늘 그리기"**로 나왔다.
  글자 수는 1자부터 보이고 180자에서 주황, 200자에서 빨강이 된다
- **02 를 세로 예산에 맞춰 다시 배치했다.** 150 짜리 정사각 그림 자리가 카드째 맨 위에 있어서
  (254) 공책이 화면 끝에 걸치고 버튼이 잘렸다 - 홈에 들어와도 쓸 곳이 안 보였다.
  그림 자리를 **가로로 눕혀 94** 로 줄이고(점선과 캐릭터는 남아 "여기에 생긴다"는 말은 그대로)
  덩이 간격을 24 -> 16 으로 좁혀 공책과 "오늘 그리기"를 접힌 선 위로 올렸다.
  390x844 헤드리스 렌더로 빈 상태·쓴 상태 둘 다 확인
- **`Screen` 에 키보드 처리 3종**(`automaticallyAdjustKeyboardInsets`,
  `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="interactive"`). 모든 화면에 적용된다.
  특히 두 번째가 없으면 키보드가 떠 있을 때 **첫 탭이 먹혀** 버튼이 고장 난 것처럼 보인다
- 02 칩 줄의 바깥 여백 보정이 16 -> 28(`gutter.wide`). `Screen width="wide"` 의 실제 여백과 달라
  칩이 화면 끝까지 밀리지 않고 있었다
- **03 AI 생성 중 화면을 다시 디자인했다.** 기다리는 사람에게 필요한 넷을 쌓는다 -
  확신 · 근거 · 예상 · 빠져나갈 길
  - 젤리 세 알과 불확정 막대를 **`DrawingBoard`** 로 바꿨다. 색연필이 액자 안의 과일 하나를
    칠해 나간다. 막대는 불확정이어도 "막대"라서 차오르는 것으로 읽혀 가짜 진행률이 된다
    (`hand-drawn-ui` 5장: 이 체계의 기다림은 차오르는 빗금이다)
  - 그리는 것이 **어느 감정도 아닌 둥근 과일**인 이유: 아홉이 전부 과일이라 하나를 고르면
    04 의 판정을 미리 말해 버린다
  - 안내 문구가 경과에 따라 넷으로 갈린다(0s / 20s / 60s / 5분). **진행률이 아니다** -
    서버가 단계를 주지 않으므로 "무엇을 하는 중"은 끝까지 한 문장이고 바뀌는 것은 기다린 시간뿐이다
  - **"나중에 볼게요"**(딤을 눌러도 된다). 접으면 02 흐름 안에 띠만 남고 탭을 돌아다닐 수 있다.
    기다림을 강제하지 않는다 - 생성은 서버가 계속하고 다 되면 홈에 그대로 있다
  - 새 공용 컴포넌트 **`SketchLine`**(물결 밑줄·구분선). 설계만 있던 `Separator` 자리를 채웠다
  - iOS 시뮬레이터 + 실제 백엔드로 확인했다. 거기서 둘을 고쳤다 - 밑그림까지 덮개에 가려 과일이
    반쪽으로 보이던 것, 연필이 액자 왼쪽 벽에서 반쯤 잘린 채 튀어나오던 것
- **생성 중 폴링에 상한을 걸었다.** 1초 고정 -> 30초까지 1초, 2분까지 3초, 5분까지 10초, 그 뒤 멈춤.
  영원한 1초 폴링은 배터리를 먹고, 상한 없는 대기는 에러 처리를 안 한 것과 같다(03 화면 규칙).
  멈춘 뒤에는 카드가 **"지금 확인하기"**(1회 조회)를 준다. 간격·상한은 `useDiary.ts` 의 `POLL_STEPS` 한 곳
- **날씨 6종을 감정 9종 과일 캐릭터로 교체** (`feat/emotion-fruit` 머지)
  - `Weather` -> `Emotion`(`HAPPY` `ENERGETIC` `SOSO` `SHY` `EMBARRASSED` `TIRED` `SAD` `DEPRESSED` `ANGRY`).
    날씨는 은유를 한 겹 더 거쳤고 6칸이 좁았다 - 화남·황당함·부끄러움이 비와 흐림에 뭉쳐 있었다
  - 앱: `shared/weather.ts` -> `shared/emotion.ts`, 캐릭터 PNG 9장(`assets/images/emotions/`),
    `EmotionFace`·`EmotionGauge` 추가. `useWeatherColors` -> `useEmotionColors`, `weatherInk` -> `emotionInk`
  - **감정의 정체성은 그림이 나르고 색은 장식이다.** 과일에서 뽑은 색이라 빨강이 셋(체리·딸기·토마토)이고
    dataviz 범주형 검증을 통과하지 못한다. 색점으로 감정을 표시하던 자리(04 판정 칩, 08 피드 칩, 05 월 요약)를 전부 캐릭터로 바꿨다
  - 04 액션이 "저장됨(비활성) / 공유" -> **"저장(그림 내려받기) / 업로드"**. 자동 저장은 안내할 것이지 버튼으로 둘 일이 아니었다
  - 캐릭터 치수와 면 처리는 `docs/screen/prototype.html` 을 따른다: 02 최근 78/58 · 04 판정 칩 24 ·
    05 셀 40/30 · 05 요약 26 · 08 썸네일 88/64 · 칩 24. **썸네일 면에 감정 색을 깔지 않는다**
  - 02 에 **감정 세기 게이지**(-2 ~ +2). 감정마다 고를 수 있는 쪽이 다르다(`POLARITY`). 값은 아직 서버로 보내지 않는다
  - 뱃지: `SUNNY_RECORDS`/`RAIN_RECORDS`/`ALL_WEATHERS` -> `HAPPY_RECORDS`/`SAD_RECORDS`/`ALL_EMOTIONS`.
    "감정 탐험가"가 6종 전부 -> 9종 전부. **code 는 식별자라 바꾸지 않았다**(획득 이력이 그 값으로 쌓인다)
  - DB: `sql/patch/2026-10-05-날씨-감정-전환.sql`. 컬럼 이름 변경 + 값 변환 + 인덱스 이름 변경.
    브랜치의 PostgreSQL 문법을 **MySQL 8.0 으로 다시 썼다**(`COMMENT ON COLUMN` -> `MODIFY COLUMN ... COMMENT`,
    `ALTER INDEX` -> `ALTER TABLE ... RENAME INDEX`, DDL 암시적 커밋 때문에 트랜잭션 묶음 해제·멱등 UPDATE)
  - **되돌릴 수 없다.** 9 -> 6 으로 되돌리면 `ANGRY`·`EMBARRASSED`·`SHY` 가 가장 가까운 값으로 뭉개진다

### Added
- **획을 Skia 로 그린다** (`@shopify/react-native-skia`). 색연필이 색연필처럼 안 보이던 것이 계기다 -
  SVG 의 `strokeDasharray` 는 주기가 있어 결이 아니라 구슬이 꿰였다. Skia 의 `DiscretePathEffect` 는
  토막마다 난수로 밀어 주기가 없다. **Expo Go 에 포함된 패키지라 개발 빌드는 필요 없다**
  - 딸려 온 것: `react-native-reanimated` 4.3.1, `react-native-worklets` **0.8.3**(SDK 56 이 못 박은 값 -
    최신 0.13.0 을 깔면 네이티브가 어긋나 "not installed" 로 뜬다), `babel.config.js` 신규
  - 손그림 테두리와 종이 결은 그대로 `react-native-svg` 다. Skia 는 획에만 쓴다

- **AI 그림 위에 덧그리기** (04). 전체 화면 모달 + 도구 5종(연필·색연필·사인펜·형광펜·붓) + 지우개,
  색 8종, 굵기 3단계, 되돌리기, 전체 지우기. **새 의존성 없이** RN 내장 `PanResponder` 와
  이미 쓰는 `react-native-svg` 로 만들었다.
  도구마다 긋는 방식이 다르다 - 연필은 톱니, 색연필은 세 번 겹쳐 긋기, 형광펜은 각진 끝,
  붓은 속도에 따라 굵기가 변한다. **저장은 아직 안 된다**(화면 문서 04 7장에 두 선택지를 적어 뒀다)
- **배경을 브랜드에서 뽑은 연한 하늘(`#F2F5F8`)로.** 따뜻한 쪽을 두 번 시도했다가 접었다 -
  문제는 밝기가 아니라 노란기였다. 과일 캐릭터가 전부 따뜻한 색이라 서늘한 바탕에서 오히려 산다.
  글로우도 같이 식혔다(`#f8fbff`)

- **배경이 종이가 됐다.** 바닐라 `#faf4dc` -> 종이 `#F3EBDA` + `PaperGrain`(점 520 개를 흩뿌린 종이 결).
  더 밝은 종이로 올리면 흰 카드와 ΔE 2.1 까지 좁아져 카드가 사라진다 - 한 단계 내린 값이
  본문 10.59 · 보조 5.26(AA) · 카드 분리 ΔE **5.5**(전 3.7)를 동시에 만족한다. `CLAUDE.md` 선언도 같이 고쳤다
- **남아 있던 자로 잰 선을 전부 손그림으로.** 커뮤니티 필터 칩 · 홈 빠른 감정 칩 · MY 설정 목록 ·
  06 세그먼트 · 07 뱃지 메달 · 09 상점 테마 칸 · 02 입력창 · 04 "AI generated" 표식 ·
  08 게시글 썸네일 · 02 최근 3일. 자리마다 다른 `seed` 라 한 줄에 선 것들이 제각기 떨린다
- 손그림 컴포넌트 `PaperGrain` 추가 (설계만 있던 15종 중 첫 구현)

- **손그림 컴포넌트를 실제로 구현했다.** 전까지 스킬·문서에는 "컴포넌트 20종"이라 적혀 있었지만
  저장소에 있던 것은 `SketchBorder` 하나였다 - 목록이 구현처럼 읽히던 것을 바로잡고 6종을 만들었다
  - `sketch.ts` **엔진**. Rough.js 는 DOM 을 쓰므로 RN 에서 못 돈다. 같은 입력(roughness·bowing·
    fillStyle·hachureGap·seed)을 받아 `react-native-svg` 가 그릴 자료로 바꾼다.
    채우기 6종(hachure · cross-hatch · dots · dashed · zigzag · solid)
  - `SketchShape.tsx` 도형 하나. 원본의 `rc.path(d, options)` 자리
  - `SketchButton.tsx` · `SketchBadge.tsx` · `Tape.tsx` - 원본(SketchUI)의 Button/Badge/Tape 포팅.
    **3D 두께**(옆면 85도·바닥 -35도), 모양 4종, 찢긴 가장자리 3종까지
  - `/sketch-gallery` 견본 화면 - 실제 기기에서 그려진 모습을 눈으로 확인하는 자리
- **공용 `Button` 이 손으로 그려진다.** 호출부를 고치지 않고 컴포넌트만 바꿔 11개 화면의 버튼이 한 번에 바뀌었다.
  면은 `solid`(빗금 위 글자는 못 읽는다), 손그림 티는 테두리가 낸다. 라벨마다 다른 seed 라 버튼들이 제각기 떨린다.
  눌리면 roughness 1.3 -> 1.9 로 거칠어진다 - 원본이 hover 에서 하던 일을 눌림이 받는다

- **손그림(색연필) UI 체계.** 레퍼런스 둘(Hand Drawn 가이드, Rough.js 기반 SketchUI)을 읽고 이 저장소의 기본 표현으로 삼았다
  - 스킬 `hand-drawn-ui` - 선의 성질(떨림 1.4 · 휨 0.8 · **겹쳐 긋기**), 색연필 팔레트 16색,
    컴포넌트 20종, RN 에서 Rough.js 없이 같은 선을 만드는 법. `components.md` 에 복사해 쓰는 코드
  - `app/src/shared/ui/SketchBorder.tsx` - 손으로 그은 테두리. 둘레를 7px 로 찍고 seed 고정 난수로 밀어
    2차 곡선으로 잇고 **두 번 긋는다**. `Card` 의 `borderWidth` 를 이걸로 바꿨다
  - `docs/design/components.html` - 브라우저에서 바로 열리는 컴포넌트 목록. 실제로 그려진 견본 + RN 코드
  - `CLAUDE.md` 디자인 선언과 프로젝트 스킬 4장에 **기본값으로 못 박았다**

- **02 빈 그림 자리에 캐릭터.** 물음표 한 글자가 서 있던, 앱에서 가장 큰 빈 칸이다(투명도 0.35)

- **빈 화면에 감정 캐릭터를 세웠다** (`shared/ui/StateBlock.tsx`). 회색 글씨 한 줄이던 자리에
  캐릭터 -> 제목 -> 한 줄 안내 -> 행동을 쌓는다. `page`(목록 전체가 빔)와 `inline`(카드 한 칸이 빔) 두 벌.
  얼굴은 호출부가 고른다 - 08 에서 "행복한"으로 거르고 결과가 없으면 그 행복한 딸기가 선다
- **10 프로필 아바타가 캐릭터가 됐다.** 두 색 그라디언트 원이었다. 캐릭터 9종이 생긴 뒤로 안 고쳐진 자리다
- **11 로그인 가운데에 캐릭터 셋**(체리·딸기·복숭아). 제목과 버튼 사이가 화면 절반이 빈 노랑이었다

- **시스템 구성도** `docs/시스템구성도.drawio` (+ 내보낸 `.png`, `.pdf`). 2페이지 -
  FIG.01 전체 구성 · FIG.02 생성 시퀀스. 스타일은 `docs/시스템구성도_0927.drawio` 의 어법을 따랐다.
  **미구축 영역을 회색 점선으로 같이 그린다** - 없는 것을 지어내지 않는 대신, 없다는 사실을 그림에 남긴다
- 종료 훅 `.claude/hooks/before-stop.sh` 에 **3층(구성도 미갱신 확인)** 추가.
  새 도메인·기술 컨텍스트 폴더, CI·Dockerfile, 새 ADR, 외부 연동·인증·캐시·배치·스토리지·푸시가
  코드에 등장하면 한 세션에 한 번 잡는다. 기존 도메인에 파일이 하나 느는 것은 세지 않는다
- **11 로그인 화면** (`app/app/login.tsx`, `docs/screen/11-login.md`). 시안에 없던 화면 -
  01 온보딩의 "이미 계정이 있어요"가 갈 곳이 없어 홈으로 보내던 자리를 채운다. 인증이 없어 누르면 홈으로 간다

### Fixed
- **탭바에서 어느 탭이 켜졌는지 읽히지 않던 것.** 비선택을 같은 색 28% 로 흐려 둬서
  캘린더의 선택/비선택 대비 차이가 0.64 뿐이었다. 더 큰 문제는 **고른 탭조차 비텍스트 3:1 미만**이었다는 것
  (캘린더 1.82 · 커뮤니티 2.04 · MY 2.39 · 그래프 2.56 · 홈 3.01). 색상을 유지한 채 명도만 내려
  전부 3.2 이상으로 맞추고(`tabTintFor`), 비선택은 무채색으로 물러나게 했다
- **칩 키가 제각각이던 것** - `EmotionFace` 의 감정별 배율 때문에 "슬픈"이 "행복한"보다 크고,
  얼굴 없는 "추천"은 둘보다 12 낮았다. 키를 36 으로 고정하고 터치 영역을 거기서 계산한다
- 세그먼트 키를 버튼 `medium`(40)에 맞췄다

- **04 액션 버튼이 두 줄로 접히던 것** - "다시 그리기"가 `다시그리 기`. 글자 길이가 아니라 **여백**이 원인이었다.
  `fill` 로 폭을 셋이 나누면 칸당 약 103인데 `large` 의 좌우 여백 24가 그대로 들어가 글자 자리가 55만 남았다.
  `fill` 일 때 여백 8 + 글자 13 + **라벨 한 줄 고정**. 라벨도 `다시그리기` -> `다시 그리기`
- **화면이 전체적으로 뿌옇던 것** - 바닐라 배경과 흰 카드의 차이가 ΔE 4.3 뿐이라 카드가 묻혔다.
  `border` 0.12 -> 0.16, `shadow.md` 를 한 단계 또렷하게. 배경색은 브랜드 선언이라 건드리지 않았다
- **02 인사말의 "님" 한 글자가 둘째 줄에 남던 것** - 닉네임 안의 띄어쓰기에서 줄이 갈렸다.
  `안녕하세요,` / `{닉네임}님` 두 줄로 우리가 먼저 나눈다
- 면 없는 `ghost` 버튼이 눌러도 아무 반응이 없던 것

- **한글이 깨져 나오던 것** - 뱃지 이름이 전부 `ì²« ê¸°ë¡`. DB 안의 값은 멀쩡했고 범인은 **연결 문자셋**이었다.
  MySQL 의 `character_set_client` 가 latin1 이라 UTF-8 바이트를 잘못 읽었다.
  `application-local.yml` 의 JDBC URL 에 `characterEncoding=UTF-8` 을 박았다 -
  서버 설정에 기대면 다른 사람 로컬에서 또 터진다
- **09 상점이 500 으로 죽던 것** (`GET /api/v1/profile/store/items`).
  `ProfileService.storeItems` 가 클래스의 `readOnly = true` 를 물려받는데 프로필이 없으면 INSERT 를 한다 -
  처음 보는 사용자가 09 를 **먼저** 열었을 때만 터져서, 10 을 먼저 본 사람에게는 안 보였다.
  메서드에 `@Transactional` 을 덮어쓰고 회귀 테스트를 붙였다
- **01 "이미 계정이 있어요"의 대비** - 뒤 띠의 갈색 선이 글자를 가로질러 1.0:1 까지 떨어지던 자리.
  불투명한 알약 면을 깔아 5.54:1 (화면 문서 01 8장의 미해결 항목이었다)
- **09 테마 미리보기가 이름과 어긋나던 것** - 감정 9색을 순서대로 돌려 써서 "Mint Soda" 아래 빨강이 깔렸다
- 07 뱃지에 남아 있던 "날씨 6색" 문구를 "감정 9색"으로

- 머지 충돌 8건 해소. main 의 `4e0cca0`(prototype 디자인 전면 이식)과 브랜치가 같은 UI 파일을 건드렸다 -
  **디자인은 main, 감정 모델은 브랜치**로 합쳤다
- 브랜치가 보지 못한 화면(06 그래프 KPI, 07 뱃지 메달, 09 상점, 10 마이페이지, 연속 기록 칩)의
  `useWeatherColors` 참조를 `useEmotionColors` 로 옮겼다. 그대로 두면 삭제된 `shared/weather.ts` 를 가리켜 빌드가 깨진다

### Changed
- DB를 **PostgreSQL -> MySQL 8.0** 으로 교체 (ADR `docs/adr/2026-10-14-DB를-MySQL로.md`)
  - `sql/patch/*.sql` 4개를 MySQL 방언으로 제자리에서 다시 씀. 아직 어느 환경에도 실행되지 않아 새 패치를 쌓지 않았다
  - 부분 unique 인덱스 -> `alive` 생성 컬럼(`IF(deleted_at IS NULL, 1, NULL)` STORED)을 unique 키에 끼우는 방식.
    하루 1건·중복 좋아요·중복 공유·프로필 1개를 DB가 보장하는 것은 그대로다
  - 시퀀스 7개 -> `AUTO_INCREMENT`. 엔티티 7개의 `@GeneratedValue` 를 `IDENTITY` 로 (`allocationSize = 50` 의 쓰기 배치는 잃는다)
  - `timestamptz` -> `datetime(6)`. 저장은 계속 UTC(`hibernate.jdbc.time_zone`)
  - 드라이버 `mysql-connector-j`, Testcontainers 이미지 `mysql:8.4`, 접속 URL(`application-local.yml`, `.env.example`)
  - **`ddl-auto: validate` 와 DDL 실행은 아직 검증 전이다** (MySQL 8.0 또는 Docker 필요). `./gradlew test` 74건은 통과
- 디자인 프리셋을 **soft-modern -> muted-sky** 로 교체 (채도 낮은 하늘색, 배경 바닐라 `#faf4dc`)
  - `tokens.ts` 를 다시 씀. 의미 토큰에 `highlight`/`highlightText`/`rule`/`weatherInk`/`decor`/`scrim`/`skeleton`/`track` 추가
  - 날씨 6색을 스킴에 따라 갈리지 않게 고정. 그 위 글자색은 `weatherInk` 로 못 박았다
    (6색 전부 4.5:1 통과, 최악은 비 `#8fa9c8` 위 5.19:1)
  - 타입 스케일·라운드·버튼 높이를 프리셋 값으로 교체 (본문 14, xlarge 버튼 63)
- 서체를 **SUIT 하나로 통일** (`expo-font`, 굵기 4종)
  - **`fontWeight` 를 쓰지 않는다.** RN 이 커스텀 폰트의 굵기를 합성하지 못해 패밀리로 고른다
  - 24곳을 `fontWeight` -> `fontFamily` 로 바꾸고, 폰트가 상속되지 않아 `fontSize` 가 있는 54곳에 `fontFamily` 를 채웠다
  - 토큰에서 `font.weightMedium`/`weightBold` 를 뺐다 - 남겨 두면 다시 쓰게 된다
- 01 온보딩을 손그림 리디자인으로 교체
  - 슬라이드 3장 -> **1장**. 시안에 없는 2·3번을 지어내지 않는다. `dots` 는 장식이라 스크린리더에서 숨긴다
  - 히어로를 `jelly-bowl` 아이콘 -> 손그림 `onboarding.png`. 알파 경계 상자를 재서 그림만 레이아웃 박스로 삼는다
  - 노트 괘선(`NotebookLines`)과 바닥 띠 `bottom.png` 추가
  - 헤드라인 문구 교체 + "오늘의 기분"·"그림일기" 뒤 형광펜 띠(녹아웃 글자, 대비 5.93:1)

### Added
- 동작하는 HTML 프로토타입 `docs/screen/prototype.html` (10화면 전부, 규칙 기반 AI 대역 포함)
  + 정적 한눈에 보기 `docs/screen/index.html`
- `@assets/*` 경로 별칭과 `app/assets.d.ts`(png 선언). SVG 는 import 하지 않는다 - 아이콘은 `Icon.tsx` 가 코드로 그린다

### Fixed
- 장식 이모지 제거 (인사말 사탕, 커뮤니티 아바타, Plus 왕관). 아바타는 닉네임 첫 글자, Plus 는 글자 배지
- 백엔드 첫 빌드 검증: 컴파일 오류 4곳 수정(`WordCounter` 정규식 이스케이프, `Meta` record 접근자 충돌, `CommunityCursor.decodeRaw` 누락, `ArchitectureTest`의 ArchUnit 1.3.0 미지원 API·lombok 런타임 참조). Gradle wrapper 추가, `./gradlew test` 74건 통과
- 앱 `@types/react` 누락 추가 (Expo 기동 시 필수)

### Added
- 화면 05~10 구현 (시안 10화면 전부 동작)
  - 05 감정 캘린더 / 06 감정 그래프: 새 테이블 없이 `tb_diary` 기간 집계. `GET /api/v1/diaries/calendar|stats|overview`
  - 연속 기록 계산을 `StreakCalculator` 한 곳으로 고정 (02·06·10이 같은 값)
  - 07 뱃지: `tb_badge`(정의) + `tb_user_badge`(획득), 시안 12종 seed. 일기 완료 이벤트로 서버가 판정
  - 08 커뮤니티: `tb_community_post`/`tb_post_like`/`tb_post_report`, 커서 페이징(최신/인기), 좋아요 멱등, **신고 동선**
  - 09·10 프로필·꾸미기: `tb_profile`, 테마·캐릭터 `StoreItem` enum, Plus 잠금 판정은 서버가
  - 01 온보딩: 슬라이드 3장 + 로컬 완료 플래그(AsyncStorage)
  - 04 과거 날짜 모드 라우트 `app/diary/[id].tsx`, 결과 화면에 공유·뱃지 획득 카드
- 앱 공용 컴포넌트: `Screen`/`ScreenHeader`/`Chip`/`Segmented`/`ListRow`/`StateBlock`(로딩·빈·에러·스켈레톤)
- 날씨 어휘를 `shared/weather.ts`로 올림 (캘린더·그래프·커뮤니티가 같이 쓴다) + 날씨 색 토큰

- 일기 도메인: 하루 한 줄 기록 -> AI 감정 날씨 판정 -> 그림 결과의 핵심 루프 (화면 02·03·04)
  - `POST /api/v1/diaries`, `GET /api/v1/diaries/{id}`, `GET /api/v1/diaries/today`, `GET /api/v1/diaries`(커서), `POST /api/v1/diaries/{id}/regenerate`
  - `tb_diary` 테이블, 하루 1건 부분 unique, 커서 페이징 인덱스
  - AI 대역 `MockDiaryPainter` (규칙 기반). 실모델은 `app.ai.provider`로 교체
- Expo 앱: 탭 5개 + 홈 탭에서 기록/생성중/결과 분기, 디자인 토큰(soft-modern)
- 관측성: `AppLog` 구조화 로그 헬퍼, 요청 종료 1줄 로그, traceId 전파(@Async 포함)
- 검증 하네스: ArchUnit 9규칙, 단위/통합 테스트 분리, Spotless, Claude/git hook
- 문서: 화면 10건, API 명세, DB 변경, 도메인 비즈니스 로직, INDEX/BOARD

### Added
- **08 커뮤니티 "추천" 정렬** (기본값). 내 오늘 기분과 비슷한 글 먼저 - 날씨 일치 2 + 기분 1칸 이내 1 + 최근 3일 1점. 임베딩이 아니라 규칙 점수(`FeedTaste`)이고 AI 호출이 0이다. 오늘 기록이 없으면 최신순으로 폴백
  - `tb_community_post.mood_score` 추가, 커서에 정렬 점수를 싣도록 `CommunityCursor` 확장
  - **다양성**: 상위 10개 중 2개는 다른 날씨(`FeedDiversity`). 재배열이라 커서는 그대로다
  - 새 범용 스킬 `feed-ranking`(정렬 축·커서 충돌·다양성·콜드 스타트), `similarity-search`(유사도 계산·임계값·평가)

### Changed
- **뱃지 정의를 코드 enum(`BadgeType`)에서 `tb_badge` 마스터 테이블로 옮겼다.** 이름·조건 문구·임계값·정렬은 데이터, 무엇을 재는지(`BadgeMetric`)와 판정식(`지표 >= 임계값`)은 코드. `tb_user_badge.badge_type` -> `badge_code`. 기존 지표를 쓰는 새 뱃지는 INSERT 한 줄로 늘어난다
- **패키지 구조**: `domain/`에는 엔티티(테이블)만 남기고 enum·값 객체는 `type/`, 이벤트는 `event/`, 포트는 `port/`로 뺐다. 순수 계산 3종은 `common/util`로 올리며 이름을 하는 일로 바꿨다(`DiaryStreak`->`StreakCalculator`, `DiaryWords`->`WordCounter`). ArchUnit이 `..domain..`에 `@Entity`를 요구한다
- **모델 연동을 `com.jellydiary.llm` 컨텍스트로 모았다.** `app.ai.*` -> `app.llm.*`(`llm/config/LlmProperties`), 계약과 구현은 `llm/painter/`(`DiaryPainter`/`DiaryPainting`/`MockDiaryPainter`). `diary/infrastructure`와 `diary/port`는 없앴다. ArchUnit 11번이 `llm -> controller/service/repository`를 막는다
- `DiaryProperties`가 `app.diary.*`만 담는다. 전역인 `app.timezone`은 `Clock` 빈이 통째로 물고 있어 도메인 설정에서 뺐다
- **앱 UI의 이모지를 전부 SVG 아이콘으로 바꿨다**(`app/src/shared/ui/Icon.tsx`, 25종). 플랫폼마다 모양이 다르고 토큰 색을 못 따르고 스크린리더가 이름을 제멋대로 읽는다
- 산출물 문서의 이모지 제거(`deliverable-write` 30행). `.githooks/no-emoji.js`가 커밋 때 막는다
- **도메인 예외를 `BusinessException(ErrorCode)`로 통일했다**(`api-design` 3장). `Diary`·`Profile`이 `IllegalArgumentException`/`IllegalStateException`을 던지고 서비스가 잡아 번역하던 계층을 없앴다 - 같은 규칙이 어느 코드로 나가는지가 두 곳에 흩어져 있었다. 어댑터 계약 위반·설정값 오류 같은 **시스템 예외는 그대로** `IllegalArgumentException`이다
- 프로필 기본값을 엔티티 상수에서 뺐다. `app.profile.default-ai-style`·`max-nickname-length` -> `ProfilePolicy`로 도메인에 넘긴다(config-and-secrets 4-1장). 기본 닉네임은 `NicknameGenerator`가 "형용사 + 명사"로 만든다 - 모두가 "젤리"면 08 피드가 같은 이름으로 찬다
- `Clock` 빈이 `app.timezone`으로 고정된다. UTC 시계 + 호출부마다 `withZone`은 한 곳만 빠져도 자정 근처에서 틀린다
- 제약 위반(`DataIntegrityViolationException`) 일반 처리가 `COMMON_CONFLICT`로 바뀌었다. "오늘은 이미 기록했어요"는 이제 `DiaryService`가 `saveAndFlush`로 직접 잡는다 - 예외 처리기가 제약 이름을 모른 채 일기 코드로 단정하던 것을 고쳤다
- `app/package.json`의 react 핀을 19.2.3으로 (react-native 0.85가 `^19.2.3`을 요구해 설치가 실패하고 있었다)

### Fixed
- 다시 그리기의 "아직 그리는 중"이 `DIARY_REGENERATE_LIMIT`으로 나가고 있었다. 상한을 다 쓰지 않았는데 "오늘은 더 다시 그릴 수 없어요"가 보였다 -> `DIARY_NOT_DONE`
- 앱 타입 오류: 다크 팔레트가 `as const` 리터럴 타입과 충돌하던 문제 (`Colors`/`WeatherColors` 타입 명시)

### Known issues
- **백엔드 빌드·테스트 미검증** (이 환경에 JDK 11만 있고 Gradle·wrapper가 없다). 앱은 `npx tsc --noEmit` 통과
- 인증 없음. `X-User-Id` 헤더로 임시 식별. 계정 삭제 없음(두 스토어 필수)
- 커뮤니티 신고를 받기만 하고 처리 도구·차단이 없다 (배포 전 필수)
- 구독 결제·영수증 검증 없음. Plus 항목은 아무도 쓸 수 없다
- 댓글 없음 (`commentCount`는 항상 0, 뱃지 `FIRST_COMMENT`·`PREMIUM`은 영구 잠김)
