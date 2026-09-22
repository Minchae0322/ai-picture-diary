# 앱 설치

Expo 관리 패키지 버전은 손으로 적지 않는다(expo-app-conventions 10장). SDK가 정하게 한다.

```bash
cd app
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar @tanstack/react-query \
  react-native-svg @react-native-async-storage/async-storage
npx expo install --fix
npx expo-doctor
npm run start
```

- `react-native-svg`: 06 감정 그래프의 추이선. 차트 라이브러리 대신 선 하나를 직접 그린다
- `@react-native-async-storage/async-storage`: 01 온보딩 완료 플래그. 서버가 알 필요 없는 기기별 값

`.env.example`을 `.env`로 복사하고 `EXPO_PUBLIC_API_BASE_URL`을 로컬 IP로 바꾼다.
에뮬레이터가 아닌 실기기는 `localhost`가 아니라 PC의 LAN IP여야 한다.
