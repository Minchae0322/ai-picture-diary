---
name: expo-app-conventions
description: React Native / Expo 앱의 코드를 쓰거나 고칠 때 자동 적용. "Expo", "React Native", "RN", "Expo Router", "SecureStore", "AsyncStorage", "FlatList", "StyleSheet", "SafeArea", "app.json", "eas", "네이티브 모듈", "안드로이드에서만 안 돼", "실기기" 요청이나 `.tsx`가 `react-native`를 import하는 순간 트리거. 웹 기준인 frontend-* 스킬 중 무엇을 그대로 쓰고 무엇이 RN에서 달라지는지 정하고, 토큰·안전영역·터치타깃·토큰 저장·환경변수·라우팅·목록·접근성·플랫폼 분기·버전 고정 규칙을 담는다. 스토어 제출은 `app-store-release`.
---

# Expo 앱 규칙 (expo-app-conventions)

## 목적
`frontend-architecture` / `frontend-state` / `frontend-api-client` / `ui-fundamentals` / `design-system`은 **웹 기준**으로 쓰였다. 구조와 판단 규칙은 RN에서도 그대로 맞지만, **플랫폼 API가 없거나 다른 지점**이 있다. 이 스킬은 그 차이만 다룬다. 중복해서 다시 쓰지 않는다.

기준 시점 **2026-09 확인**: Expo SDK 56(2026-05-21), React Native 0.85, React 19.2. SDK 56부터 `expo-router`가 react-navigation에 의존하지 않는다. 버전이 걸린 판단은 착수 전 `docs.expo.dev`에서 재확인한다.

## 언제 적용
RN/Expo 프로젝트를 새로 만들 때, 화면·컴포넌트·훅을 쓸 때, 웹 코드를 RN으로 옮길 때, "웹에선 되는데 앱에선 안 된다"류 문제.

## 0. 웹 스킬 중 무엇이 그대로이고 무엇이 다른가

| 웹 스킬 | RN에서 | 이 스킬에서 다루는 차이 |
|---|---|---|
| `frontend-architecture` | 그대로 | 라우팅이 파일 기반(6장) |
| `frontend-state` | 그대로 | 토큰 저장 위치(3장) |
| `frontend-api-client` | 그대로 | httpOnly 쿠키가 없다(3장) |
| `ui-fundamentals` | 판단은 그대로 | 안전영역·키보드(1장), 터치 타깃(2장), 상태 5종의 표현 |
| `design-system` | 3계층 그대로 | CSS 변수가 없다(4장) |

**먼저 웹 스킬을 읽고, 여기서 해당 절만 덮어쓴다.** 순서를 뒤집지 않는다.

## 1. 안전영역과 키보드는 기본 구조다

- 노치·홈 인디케이터·상태바를 **화면마다** 처리하지 않는다. `react-native-safe-area-context`의 `useSafeAreaInsets()`를 쓴다.
- 인셋은 **컨테이너가 아니라 스크롤 내용(`contentContainerStyle`)에** 준다. 컨테이너에 주면 스크롤이 노치 밑에서 잘린다.
- 입력창이 있는 화면은 `KeyboardAvoidingView`로 감싼다. **iOS는 `behavior="padding"`, Android는 없음**이 기본이다. 한쪽만 맞추고 끝내지 않는다.
- 가로 여백은 어느 폭에서든 16 이상. 태블릿·폴더블에서 한 줄이 화면을 가로지르지 않게 본문 최대 폭을 둔다.

## 2. 터치 타깃은 44

- WCAG 2.2 SC 2.5.8은 24×24이지만 모바일 실사용 기준은 **44**다. 토큰에 `MIN_TOUCH_TARGET = 44`를 두고 누를 수 있는 모든 것에 `minHeight`로 건다.
- 아이콘만 있는 버튼은 시각 크기가 작아도 **히트 영역**을 44로 넓힌다(`hitSlop`).
- `:focus-visible`이 없다. 대신 **누름 상태(`Pressable`의 `pressed`)**를 반드시 표현한다. 아무 반응 없는 탭은 고장으로 읽힌다.

## 3. 토큰 저장: 액세스는 메모리, 리프레시는 SecureStore

- 모바일에는 **httpOnly 쿠키가 없다.** 리프레시 토큰을 클라이언트가 들고 있어야 한다.
- **AsyncStorage는 평문이다.** 토큰·개인정보를 넣지 않는다. `expo-secure-store`(iOS 키체인 / Android Keystore)를 쓴다.
- 액세스 토큰은 **메모리에만** 둔다. 앱을 껐다 켜면 리프레시로 복구한다.
- 401 리프레시 단일화는 웹과 같다(`frontend-api-client` 4장). 회전된 새 리프레시 토큰을 **반드시 저장**한다. 옛 토큰을 다시 쓰면 서버가 유출로 보고 세션 전체를 끊는다.

## 4. 토큰은 TS 객체, 스타일은 StyleSheet

- CSS 변수가 없다. 3계층(원시 → 의미 → 컴포넌트)은 그대로 두고 **`tokens.ts`의 TS 객체**로 표현한다.
- 다크 모드는 **2단계(의미 토큰)만** 다시 정의한다. 컴포넌트에 `isDark ? A : B`가 생기면 토큰 설계가 틀린 신호다.
- 인라인 객체 대신 `StyleSheet.create`. 테마에 따라 변하는 값만 배열로 덧붙인다: `style={[styles.card, { backgroundColor: colors.surface }]}`.
- 그림자는 iOS(`shadow*`)와 Android(`elevation`)가 **다른 API**다. 토큰에 둘 다 담아 한 번에 적용한다.
- `gap`은 RN에서도 되지만, 문자열 단위(`'16px'`)·`%` 조합·`calc`는 없다. 숫자만 쓴다.

## 5. `EXPO_PUBLIC_`은 앱 번들에 평문으로 박힌다

- `EXPO_PUBLIC_*`는 빌드 시 코드에 치환된다. **APK/IPA를 뜯으면 그대로 보인다.** API 키·시크릿을 넣지 않는다.
- 여기 들어가도 되는 것: 서버 base URL, 공개 클라이언트 ID처럼 **원래 공개되는 값**뿐이다.
- 비밀이 필요한 호출은 **서버를 한 번 거친다.** 앱에서 외부 API를 직접 부르며 키를 싣지 않는다.
- `.env`, `*.jks`, `*.p8`, `google-services.json`, `GoogleService-Info.plist`는 첫 커밋 전에 `.gitignore`에 넣는다. 자세한 것은 `app-store-release`.

## 6. 라우팅은 파일 경로다

- `app/` 아래 파일 경로가 곧 URL이다. `app/posts/[id].tsx` → `/posts/12`.
- 화면 파일은 **조립만** 한다. 데이터는 훅, 표현은 `features/*/ui`. 화면에 `fetch`나 200줄짜리 JSX가 생기면 `frontend-architecture` 2장의 분리 신호다.
- 제공자(Provider)는 `app/_layout.tsx` 한 곳. 순서가 곧 의존 방향이다: SafeArea → Query → Theme → 화면.
- 딥링크를 쓸 거면 `app.json`의 `scheme`을 처음부터 정한다. 나중에 바꾸면 이미 나간 링크가 죽는다.

## 7. 목록은 FlatList

- `data.map()`으로 긴 목록을 그리지 않는다. 화면 밖 항목까지 전부 마운트되어 스크롤이 끊긴다.
- `keyExtractor`는 인덱스가 아니라 **서버 id**로. 인덱스를 쓰면 삭제 후 엉뚱한 항목이 재사용된다.
- 무한 스크롤은 `onEndReached` + `hasNextPage && !isFetchingNextPage` 가드. 가드가 없으면 같은 페이지를 여러 번 부른다.
- 로딩·빈·에러는 `ListEmptyComponent` 하나에서 분기한다. 화면 위아래로 흩뜨리지 않는다.

## 8. 접근성 props가 웹과 다르다

- `aria-*`가 아니라 `accessibilityRole` / `accessibilityLabel` / `accessibilityHint` / `accessibilityState`.
- 이모지는 스크린리더가 이상하게 읽는다. `accessibilityElementsHidden` + `importantForAccessibility="no"`로 숨기고 라벨을 따로 준다.
- 카드처럼 여러 텍스트를 담은 누를 수 있는 요소는 `accessible`을 켜서 **한 덩어리로** 읽히게 한다. 안 그러면 조각조각 읽힌다.
- 비활성 버튼에는 왜 못 누르는지 `accessibilityHint`로 남긴다.

## 9. 플랫폼 분기는 세 곳에만

1. `Platform.OS === 'ios'` - 한 줄짜리 동작 차이(키보드 behavior 등)
2. `Platform.select({ ios, android })` - 값 차이
3. `Component.ios.tsx` / `Component.android.tsx` - 구현이 통째로 다를 때

**디자인 차이를 플랫폼 분기로 메우지 않는다.** 같은 화면이 두 벌이 되면 한쪽만 고쳐지는 버그가 반드시 생긴다.

## 10. 버전은 `expo install --fix`가 정한다

- `package.json`에 Expo 관리 패키지 버전을 손으로 적지 않는다. SDK마다 호환 버전이 달라 어긋난다.
- `expo`/`react`/`react-native`만 박고 나머지는 `npx expo install <pkg>` 또는 `npx expo install --fix`로 채운다.
- `npx expo-doctor`를 CI에 넣는다. 버전 불일치는 런타임에서 이상한 모양으로 터진다.
- 네이티브 모듈을 추가하면 Expo Go로는 못 돌린다. **개발 빌드**가 필요하다. 추가 전에 이 비용을 먼저 말한다.

## 11. 시뮬레이터에서 통과해도 확인 안 된 것

아래는 **실기기에서만** 드러난다. "됐다"고 말하기 전에 어디까지 확인했는지 밝힌다.

- 키보드가 입력창을 가리는지 (특히 Android 소형 기기)
- SecureStore 동작 (생체 인증·기기 잠금 설정에 따라 다름)
- 푸시 알림, 딥링크, 카메라·사진 권한 흐름
- 느린 네트워크에서의 타임아웃·재시도
- 다크 모드 전환, 큰 글씨 설정(Dynamic Type)
- 백그라운드 복귀 후 토큰 갱신

## 하지 말 것

- 서버 응답을 `useState`에 복사해 두기 (`frontend-state` 1장)
- AsyncStorage에 토큰 넣기
- `EXPO_PUBLIC_`에 비밀값 넣기
- 긴 목록을 `map()`으로 그리기
- 안전영역을 화면마다 하드코딩한 `paddingTop: 44`로 때우기
- `expo eject` / prebuild를 먼저 제안하기 - 관리형(managed)으로 되는지 먼저 확인한다
- 실기기 확인 없이 "완료"라고 말하기
