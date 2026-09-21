# 앱 설치

Expo 관리 패키지 버전은 손으로 적지 않는다(expo-app-conventions 10장). SDK가 정하게 한다.

```bash
cd app
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar @tanstack/react-query
npx expo install --fix
npx expo-doctor
npm run start
```

`.env.example`을 `.env`로 복사하고 `EXPO_PUBLIC_API_BASE_URL`을 로컬 IP로 바꾼다.
에뮬레이터가 아닌 실기기는 `localhost`가 아니라 PC의 LAN IP여야 한다.
