// app.config.ts - Expo 앱 설정 예시. 값은 프로젝트에 맞게 바꾼다.
// 비밀 값은 여기 넣지 않는다. process.env.EXPO_PUBLIC_* 만 앱에 포함된다.
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '감정 날씨일기',
  slug: 'emotion-diary',
  scheme: 'emotiondiary',                 // 딥링크, OAuth 리다이렉트
  version: '1.0.0',                       // 사용자에게 보이는 버전
  orientation: 'portrait',
  icon: './assets/icon.png',              // 1024x1024, 투명 배경 금지(iOS)
  splash: { image: './assets/splash.png', backgroundColor: '#ffffff' },
  userInterfaceStyle: 'automatic',
  runtimeVersion: { policy: 'appVersion' },

  ios: {
    bundleIdentifier: 'com.example.emotiondiary',   // 한 번 올리면 못 바꿈. Android package와 동일하게
    supportsTablet: false,                          // true면 iPad 스크린샷(13")도 필수
    infoPlist: {
      // 권한 문자열: "왜"가 구체적이어야 심사 통과. 쓰지 않는 권한은 넣지 않는다.
      NSCameraUsageDescription: '일기에 첨부할 사진을 촬영하기 위해 카메라를 사용합니다.',
      NSPhotoLibraryUsageDescription: '일기에 첨부할 사진을 선택하기 위해 사진 보관함에 접근합니다.',
      NSUserNotificationsUsageDescription: '매일 일기 작성 시간을 알려드리기 위해 알림을 보냅니다.',
      // 추적(광고 ID, 크로스앱)을 하지 않으면 아래 줄과 ATT 요청을 넣지 않는다.
      // NSUserTrackingUsageDescription: '맞춤 광고 제공을 위해 추적 권한을 요청합니다.',
      ITSAppUsesNonExemptEncryption: false,          // HTTPS만 사용. 수출 규정 질문 생략
      CFBundleAllowMixedLocalizations: true,
    },
    // Sign in with Apple, Push 등은 EAS가 capability를 자동 동기화. 수동이면 entitlements 추가.
    entitlements: {
      'com.apple.developer.applesignin': ['Default'],
    },
    privacyManifests: {
      // expo-build-properties 또는 SDK 52+ 에서 지원. 실제 파일은 PrivacyInfo.xcprivacy 참고.
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1'] },
      ],
    },
  },

  android: {
    package: 'com.example.emotiondiary',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ffffff' },
    // 필요한 권한만. 라이브러리가 자동으로 넣는 권한은 blockedPermissions로 제거한다.
    permissions: ['android.permission.CAMERA', 'android.permission.POST_NOTIFICATIONS'],
    blockedPermissions: [
      'android.permission.READ_MEDIA_IMAGES',   // Photo Picker를 쓰면 불필요. 있으면 Play 권한 양식 요구
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.RECORD_AUDIO',
      'com.google.android.gms.permission.AD_ID', // 광고 없으면 제거. 데이터 보안 양식과 일치시킬 것
    ],
    // targetSdkVersion은 expo-build-properties로 지정. Play 요건(2026-08-31부터 36) 이상.
  },

  plugins: [
    ['expo-build-properties', {
      android: { compileSdkVersion: 36, targetSdkVersion: 36, minSdkVersion: 24 },
      ios: { deploymentTarget: '15.1' },
    }],
    'expo-apple-authentication',
    ['expo-image-picker', { photosPermission: '일기에 첨부할 사진을 선택하기 위해 접근합니다.' }],
    ['expo-notifications', { icon: './assets/notification-icon.png' }],
  ],

  extra: {
    eas: { projectId: '00000000-0000-0000-0000-000000000000' },
    // 공개 가능한 값만. 서버 시크릿은 절대 넣지 않는다.
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    kakaoNativeAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
  },
});
