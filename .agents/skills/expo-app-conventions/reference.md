# Expo 앱 규칙 - 참고

SKILL.md는 규칙만 담는다. 여기는 그 규칙을 코드로 옮긴 예와, 왜 그런지의 근거다.

## 1. 안전영역과 키보드

```tsx
// 인셋은 스크롤 "내용"에 준다. 컨테이너에 주면 스크롤이 노치 밑에서 잘린다
const insets = useSafeAreaInsets();

<FlatList
  contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
  ...
/>
```

```tsx
// iOS만 padding. Android는 windowSoftInputMode가 처리한다
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
>
```

`SafeAreaView`를 쓰면 네 변이 한꺼번에 처리되지만, 어느 변에 얼마를 줄지 못 고른다.
헤더가 있는 화면에서는 위쪽이 두 번 들어가 빈 띠가 생긴다. 인셋 훅이 기본이다.

## 2. 터치 타깃

```tsx
// 시각 크기는 24, 히트 영역은 44
<Pressable hitSlop={10} style={{ width: 24, height: 24 }} />
```

44는 Apple HIG와 Material의 권장치가 만나는 지점이다(각각 44pt / 48dp).
WCAG 2.2 SC 2.5.8의 24×24는 **최저선**이지 목표가 아니다.

`Pressable`의 누름 표현:

```tsx
<Pressable style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]} />
```

## 3. 토큰 저장

| 저장소 | 암호화 | 용도 |
|---|---|---|
| 메모리(zustand) | - | 액세스 토큰 |
| `expo-secure-store` | iOS 키체인 / Android Keystore | 리프레시 토큰 |
| AsyncStorage | **없음(평문)** | 테마 설정, 온보딩 완료 여부 같은 비민감 값 |
| MMKV | 선택 가능 | 성능이 필요한 비민감 캐시 |

```ts
const REFRESH_KEY = 'refreshToken';
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);
export const saveRefreshToken = (t: string) => SecureStore.setItemAsync(REFRESH_KEY, t);
```

주의: SecureStore는 기기 잠금이 설정돼 있지 않으면 동작이 달라질 수 있고,
값 크기 제한이 있다(큰 JSON을 통째로 넣지 않는다).

## 4. 토큰과 스타일

```ts
// 3계층은 웹과 같다. 표현만 TS 객체다
const raw = { cream: '#FFF6F0', inkPrimary: '#4A3540' } as const;

export const lightColors = { bg: raw.cream, text: raw.inkPrimary } as const;
export const darkColors: typeof lightColors = { bg: '#241A26', text: '#EAE0E6' };
//                        ^^^^^^^^^^^^^^^^^ 타입을 묶어 두면 다크에서 빠뜨린 토큰이 컴파일 에러가 된다
```

그림자 - 두 API를 한 객체에:

```ts
export const elevation = {
  sm: {
    shadowColor: '#4A3540', shadowOpacity: 0.08, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },  // iOS
    elevation: 2,                            // Android
  },
};
```

중첩 라운드(`ui-fundamentals` 2장)는 RN에서도 같은 공식이다:

```ts
export const nested = (outer: number, padding: number) => Math.max(0, outer - padding);
```

RN에 없는 CSS: `calc`, 문자열 단위, `%` 혼합 연산, 의사 클래스(`:hover`, `:focus-visible`),
`box-shadow` 문자열, `position: fixed`, 대부분의 CSS 애니메이션.

## 5. 환경 변수

```
# .env.example (이 파일만 커밋)
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

`EXPO_PUBLIC_*`는 **빌드 시 문자열 치환**이다. 런타임 조회가 아니다.
- 값을 바꾸면 다시 빌드해야 한다.
- 번들에 그대로 남는다. `npx react-native bundle` 결과를 grep하면 보인다.

환경별 분리가 필요하면 `app.config.ts`에서 `process.env.APP_VARIANT`로
`name`/`bundleIdentifier`/`scheme`을 나눈다. 자세한 것은 `app-store-release`의 템플릿.

## 6. Expo Router

```
app/
  _layout.tsx        제공자 + 네비게이터 (루트에 하나)
  index.tsx          /
  posts/[id].tsx     /posts/12
  (tabs)/            URL에 안 들어가는 그룹
  +not-found.tsx     404
```

```tsx
const { id } = useLocalSearchParams<{ id: string }>();
const router = useRouter();
router.push(`/posts/${id}`);   // 뒤로 갈 수 있게
router.replace('/');           // 로그인 성공처럼 뒤로 가면 안 될 때
```

`app.json`에 `"experiments": { "typedRoutes": true }`를 켜면 경로 문자열이 타입 검사된다.
오타로 빈 화면이 뜨는 사고를 컴파일 단계로 옮긴다.

인증 가드는 `_layout.tsx`에서 세션을 보고 `<Redirect href="/login" />`로 처리한다.
화면마다 `if (!token) router.replace(...)`를 흩뿌리면 깜빡임과 경쟁이 생긴다.

## 7. 목록

```tsx
<FlatList
  data={items}
  keyExtractor={(d) => String(d.id)}
  renderItem={({ item }) => <PostCard post={item} />}
  ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
  onEndReachedThreshold={0.4}
  onEndReached={() => {
    // 가드가 없으면 같은 페이지를 여러 번 부른다
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }}
  refreshing={isRefetching && !isFetchingNextPage}
  onRefresh={() => void refetch()}
  ListEmptyComponent={isPending ? <Skeleton/> : isError ? <ErrorState/> : <EmptyState/>}
/>
```

`ItemSeparatorComponent`를 쓰면 마지막 항목 뒤에 여백이 안 붙는다.
`contentContainerStyle`의 `gap`으로도 되지만, 구분선을 그릴 거면 이쪽이다.

항목 높이가 일정하면 `getItemLayout`을 주면 스크롤 성능이 눈에 띄게 좋아진다.
높이가 제각각이면 주지 않는다 - 틀린 값이 더 나쁘다.

## 8. 접근성

| 웹 | RN |
|---|---|
| `role="button"` | `accessibilityRole="button"` |
| `aria-label` | `accessibilityLabel` |
| `aria-describedby` | `accessibilityHint` |
| `aria-disabled` / `aria-busy` | `accessibilityState={{ disabled, busy }}` |
| `aria-hidden` | `accessibilityElementsHidden` (iOS) + `importantForAccessibility="no"` (Android) |

```tsx
<Pressable
  accessible                                   // 자식 텍스트를 한 덩어리로 읽는다
  accessibilityRole="button"
  accessibilityLabel={`${date} 게시글. ${content}`}
  accessibilityHint={pending ? '처리가 진행 중입니다' : undefined}
/>
```

확인 방법: iOS는 VoiceOver, Android는 TalkBack을 켜고 화면을 손가락으로 훑는다.
시뮬레이터에서도 켤 수 있지만 실제 제스처 느낌은 실기기에서만 맞다.

## 9. 플랫폼 분기

```tsx
// 1) 한 줄짜리 동작 차이
behavior={Platform.OS === 'ios' ? 'padding' : undefined}

// 2) 값 차이
const font = Platform.select({ ios: 'System', android: 'Roboto' });

// 3) 구현이 통째로 다를 때 - 파일을 나눈다 (import는 확장자 없이)
//    DatePicker.ios.tsx / DatePicker.android.tsx
import { DatePicker } from './DatePicker';
```

## 10. 버전 관리

```bash
npx expo install --fix     # SDK 호환 버전으로 전부 맞춘다
npx expo-doctor            # 불일치·잘못된 설정 진단
npx expo install expo-camera   # 새 패키지는 npm이 아니라 이걸로
```

SDK 업그레이드:

```bash
npx expo install expo@^57 --fix
npx expo-doctor
```

변경점은 `expo.dev/changelog/sdk-<n>`에서 확인한다. 메이저 업그레이드는
codemod가 있는 경우가 많다(SDK 56의 expo-router / react-navigation 분리 등).

Expo Go vs 개발 빌드:

| | Expo Go | 개발 빌드 |
|---|---|---|
| 설치 | 스토어 앱 하나 | EAS Build로 직접 만든다 |
| 네이티브 모듈 | Expo Go에 포함된 것만 | 무엇이든 |
| 빌드 시간 | 없음 | 10~30분 (첫 빌드) |

네이티브 모듈이 하나라도 들어가면 개발 빌드로 넘어가야 한다.
팀원 전원의 설정 비용이므로 **추가 전에** 합의한다.

## 11. 확인 체크리스트

새 화면을 "됐다"고 말하기 전에:

- [ ] 작은 Android 기기에서 키보드가 입력창을 가리지 않는가
- [ ] 노치 있는 기기와 없는 기기 둘 다
- [ ] 다크 모드로 전환했을 때 읽히는가
- [ ] 시스템 글씨 크기를 최대로 했을 때 잘리지 않는가
- [ ] 비행기 모드에서 에러 화면이 뜨는가 (무한 로딩 아님)
- [ ] 목록 100개 이상에서 스크롤이 끊기지 않는가
- [ ] VoiceOver/TalkBack으로 훑었을 때 순서가 맞는가

## 참고

- Expo SDK 변경 이력: https://expo.dev/changelog
- Expo 문서: https://docs.expo.dev
- Expo Router: https://docs.expo.dev/router/introduction/
- SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
- 환경 변수: https://docs.expo.dev/guides/environment-variables/
- Apple HIG 터치 타깃 / Material 접근성 가이드
