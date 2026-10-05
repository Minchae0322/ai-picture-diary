import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, leading, radius, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** prototype.html 의 토스트는 2.4초 뒤 사라진다 */
const DURATION = 2400;

const ToastContext = createContext<(message: string) => void>(() => {});

/**
 * prototype.html `.toast`.
 *
 * "아직 준비 안 된 화면"을 알릴 때 OS 경고창(`Alert.alert`)을 쓰면 앱의 서체·색·라운드가
 * 전부 OS 것으로 바뀐다. 프로토타입이 토스트를 쓰는 이유도 그것이고, 되돌릴 수 없는 일이
 * 아니므로 확인 버튼을 요구하지 않는다. 확인이 필요한 선택은 `Sheet` 다.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((next: string) => {
    setMessage(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), DURATION);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message === null ? null : <Toast message={message} />}
    </ToastContext.Provider>
  );
}

/** 화면 어디서나 `const toast = useToast(); toast('...')` */
export function useToast() {
  return useContext(ToastContext);
}

function Toast({ message }: { message: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rise.setValue(0);
    Animated.timing(rise, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [message, rise]);

  return (
    <View
      style={[styles.slot, { bottom: insets.bottom + TAB_CLEARANCE }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[
          styles.toast,
          shadow.md,
          {
            backgroundColor: colors.text,
            opacity: rise,
            transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          },
        ]}
      >
        <Text accessibilityRole="alert" style={[styles.text, { color: colors.bg }]}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

/** 탭바(66) 위로 12 띄운다. prototype `calc(24px + 66px + 12px)` 와 같은 자리 */
const TAB_CLEARANCE = 66 + space[3];

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: space[5], right: space[5] },
  toast: { paddingVertical: space[3] + 2, paddingHorizontal: space[4] + 2, borderRadius: radius.md },
  text: { fontSize: font.sm, lineHeight: leading(font.sm), fontFamily: font.regular },
});
