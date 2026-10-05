# 앱 설치

Expo 관리 패키지 버전은 손으로 적지 않는다(expo-app-conventions 10장). SDK가 정하게 한다.

```bash
cd app
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar @tanstack/react-query \
  react-native-svg @react-native-async-storage/async-storage expo-font
npx expo install --fix
npx expo-doctor
npm run start
```

- `react-native-svg`: 06 감정 그래프의 추이선, 그리고 `src/shared/ui/Icon.tsx` 의 모든 아이콘.
  차트 라이브러리도 아이콘 폰트도 쓰지 않는다 - 둘 다 직접 그린다
- `@react-native-async-storage/async-storage`: 01 온보딩 완료 플래그. 서버가 알 필요 없는 기기별 값.
  **평문이라 토큰·개인정보는 넣지 않는다**
- `expo-font`: SUIT 서체 등록. 파일은 저장소가 들고 있다

`.env.example`을 `.env`로 복사하고 `EXPO_PUBLIC_API_BASE_URL`을 로컬 IP로 바꾼다.
에뮬레이터가 아닌 실기기는 `localhost`가 아니라 PC의 LAN IP여야 한다.

## 서체

서체는 **SUIT(수트)** 하나로 통일한다. 파일은 `app/assets/fonts/` 에 저장소가 들고 있다
(SIL Open Font License 1.1, https://github.com/sunn-us/SUIT).

**굵기마다 파일이 따로 등록된다.** RN은 커스텀 폰트에서 `fontWeight` 로 굵기를 합성하지 못하므로
(특히 안드로이드) 굵기는 패밀리 이름으로 고른다. 토큰에 네 가지가 있다:

| 토큰 | 패밀리 |
|---|---|
| `font.regular` | `SUIT-Regular` |
| `font.medium` | `SUIT-Medium` |
| `font.bold` | `SUIT-Bold` |
| `font.black` | `SUIT-Heavy` |

- 등록은 `app/app/_layout.tsx` 의 `useFonts(FONT_ASSETS)` 한 곳이다.
- **글자가 있는 스타일에는 빠짐없이 `fontFamily` 를 넣는다.** RN은 폰트가 상속되지 않아
  빠뜨리면 그 텍스트만 시스템 폰트로 나온다.
- `fontWeight` 는 쓰지 않는다. 토큰에 `weightBold` 같은 키를 두지 않은 것도 그래서다.

## 이미지

`app/assets/images/` 의 두 PNG는 01 온보딩 전용이다(`onboarding.png` 히어로, `bottom.png` 바닥 띠).
`@assets/*` 별칭은 `app/tsconfig.json` 에 있고 Expo 가 metro 에서 그대로 읽는다.
**SVG 파일은 import 하지 않는다** - 아이콘은 `src/shared/ui/Icon.tsx` 가 코드로 그리므로
svg transformer 도 metro 설정도 필요 없다.
