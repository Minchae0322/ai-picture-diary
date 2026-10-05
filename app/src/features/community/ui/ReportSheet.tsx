import { Sheet } from '@/shared/ui/Sheet';
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

/** 신고 사유 선택. 모양은 공통 `Sheet`(prototype `.sheet`) 가 쥐고 사유 목록만 여기 있다. */
export function ReportSheet({ visible, onClose, onSubmit }: Props) {
  return (
    <Sheet
      visible={visible}
      title="신고 사유를 골라 주세요"
      body="접수된 글은 검토 후 숨겨집니다. 서버 접수는 다음 라운드입니다."
      onClose={onClose}
      options={[
        ...REASONS.map((reason) => ({
          label: reason.label,
          danger: true,
          onPress: () => onSubmit(reason.value),
        })),
        { label: '취소', onPress: onClose },
      ]}
    />
  );
}
