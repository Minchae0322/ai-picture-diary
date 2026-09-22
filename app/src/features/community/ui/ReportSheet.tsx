import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import type { ReportReason } from '../api/communityApi';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'ABUSE', label: '욕설 · 혐오' },
  { value: 'SPAM', label: '스팸 · 광고' },
  { value: 'SEXUAL', label: '선정적인 내용' },
  { value: 'PRIVACY', label: '개인정보 노출' },
  { value: 'OTHER', label: '기타' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
};

/**
 * 신고 사유 선택. 라이브러리를 더하지 않고 RN Modal 로 만든다 - 항목 5개짜리 목록에
 * 바텀시트 패키지를 들일 이유가 없다.
 */
export function ReportSheet({ visible, onClose, onSubmit }: Props) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" />
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          신고 사유를 골라 주세요
        </Text>
        {REASONS.map((reason) => (
          <Pressable
            key={reason.value}
            onPress={() => onSubmit(reason.value)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.row,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={{ color: colors.text, fontSize: font.base }}>{reason.label}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={{ color: colors.textMuted, fontSize: font.base }}>취소</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    padding: space[4],
    paddingBottom: space[8],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: space[1],
  },
  title: { fontSize: font.base, fontWeight: font.weightBold, marginBottom: space[2] },
  row: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
