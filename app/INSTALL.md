# 앱 설치

Expo 관리 패키지 버전은 손으로 적지 않는다(expo-app-conventions 10장). SDK가 정하게 한다.

```bash
cd app
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar @tanstack/react-query \
  expo-linear-gradient react-native-svg @react-native-async-storage/async-storage expo-font

# 시안 SVG를 컴포넌트로 import하기 위한 변환기. Expo 관리 패키지가 아니라 npm으로 받는다
npm install --save-dev react-native-svg-transformer

npx expo install --fix
npx expo-doctor
npm run start
```

`.env.example`을 `.env`로 복사하고 `EXPO_PUBLIC_API_BASE_URL`을 로컬 IP로 바꾼다.
에뮬레이터가 아닌 실기기는 `localhost`가 아니라 PC의 LAN IP여야 한다.

## 이 화면들이 왜 이 패키지를 쓰나

| 패키지 | 쓰는 곳 |
|---|---|
| `expo-linear-gradient` | 배경 그라디언트, 카드, 썸네일, 테마 프리뷰 - 시안 전체가 그라디언트 기반이다 |
| `react-native-svg` | `assets/figma/*.svg`(글로우·일러스트) 렌더링, 06 추이 차트, 탭 아이콘 |
| `react-native-svg-transformer` | `.svg`를 컴포넌트로 import (`metro.config.js`). 에셋을 코드로 다시 그리지 않기 위해서다 |
| `@react-native-async-storage/async-storage` | 01 온보딩 완료 플래그. **평문이라 토큰·개인정보는 넣지 않는다** |

## 폰트

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
- `fontWeight` 는 쓰지 않는다.
