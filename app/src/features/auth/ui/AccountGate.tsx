import { StyleSheet, View } from 'react-native';
import { ErrorRetry, Loading } from '@/shared/ui/StateBlock';
import { useColors } from '@/shared/theme/useColors';
import { useAccount } from '../AccountProvider';

/**
 * 사용자 번호를 손에 넣기 전에는 화면을 그리지 않는다.
 *
 * <p>그 사이에 나간 요청은 `X-User-Id` 가 비어 401 로 떨어진다. 화면마다 그 상태를 따로 다루느니
 * 입구에서 한 번 기다리는 쪽이 낫다 - 보통은 저장된 번호를 읽는 한 프레임으로 끝난다.
 *
 * <p>등록이 실패하면(서버가 꺼져 있거나 네트워크가 없으면) 재시도를 준다. 조용히 넘어가면
 * 모든 화면이 "불러오지 못했어요"가 되고 원인은 어디에도 없다.
 */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { status, error, retry } = useAccount();

  if (status !== 'loading') {
    return <>{children}</>;
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.bg }]}>
      {error ? (
        <ErrorRetry error={error} onRetry={retry} />
      ) : (
        <Loading label="준비하는 중" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
});
