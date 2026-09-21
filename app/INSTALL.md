# 앱 설치

Expo 관리 패키지 버전은 손으로 적지 않는다(expo-app-conventions 10장). SDK가 정하게 한다.

```bash
cd app
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar @tanstack/react-query \
  expo-linear-gradient react-native-svg @react-native-async-storage/async-storage

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

시안은 Noto Sans KR이다. 지금은 **시스템 폰트로 대체**했다(Android는 Noto Sans CJK KR, iOS는 Apple SD Gothic Neo).
글자 모양이 거의 같고 폰트 파일을 번들에 넣지 않아도 되어서다. 정확히 맞춰야 하면
`expo-font` + `@expo-google-fonts/noto-sans-kr`을 추가하고 `app/_layout.tsx`에서 로드한다.
