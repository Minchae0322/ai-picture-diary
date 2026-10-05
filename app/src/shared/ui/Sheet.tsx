import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Muted } from '@/shared/ui/Type';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

export type SheetOption = {
  label: string;
  danger?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  options: SheetOption[];
  onClose: () => void;
};

/**
 * prototype.html `.sheet`. 바닥에서 올라오는 선택지 목록.
 * 라이브러리를 더하지 않고 RN Modal 로 만든다 - 항목 몇 개짜리 목록에 바텀시트 패키지를 들일 이유가 없다.
 */
export function Sheet({ visible, title, body, options, onClose }: Props) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceSolid }]}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          {body ? <Muted>{body}</Muted> : null}

          {options.map((option) => (
            <Pressable
              key={option.label}
              onPress={option.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.option,
                { borderTopColor: colors.borderStrong, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[styles.optionLabel, { color: option.danger ? colors.danger : colors.text }]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space[6],
    paddingTop: space[6],
    paddingBottom: space[8],
    gap: space[3],
  },
  title: { fontSize: font.lg, fontFamily: font.bold },
  option: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: space[3] + 2,
    borderTopWidth: 1,
  },
  optionLabel: { fontSize: font.md, fontFamily: font.medium },
});
