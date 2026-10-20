package com.example.app.infrastructure.storage;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 스토리지 설정. app.storage.* 를 바인딩한다.
 *
 * - 자격증명은 가능하면 IAM 역할/워크로드 아이덴티티로 주입하고 키를 두지 않는다.
 *   키를 써야 하면 ${STORAGE_ACCESS_KEY}로, 기본값 없이 (config-and-secrets).
 * - 버킷은 환경별로 분리한다. prefix만 다르게 쓰면 실수로 운영 파일을 지운다.
 * - purposes 맵으로 용도별 허용 타입과 크기 상한을 둔다. 화이트리스트 방식.
 */
@Validated
@ConfigurationProperties("app.storage")
public record StorageProperties(

        @NotBlank String bucket,

        /** S3면 비워 둔다. R2/MinIO면 엔드포인트 지정 */
        String endpoint,

        @NotBlank String region,

        /** presigned PUT 유효기간. 짧게 */
        @NotNull Duration uploadUrlTtl,

        /** presigned GET 유효기간. 민감한 파일일수록 짧게 */
        @NotNull Duration downloadUrlTtl,

        /** 이미지 디코딩 픽셀 수 상한. decompression bomb 방어 */
        @Positive long maxPixels,

        /**
         * 원본 보관 여부. 기본 true.
         * false로 두면 용량은 줄지만 나중에 새 변형(다른 크기)을 영원히 만들 수 없다.
         * 끄기 전에 "앞으로 어떤 크기도 추가하지 않는다"를 확신할 수 있어야 한다.
         */
        boolean keepOrigin,

        @NotEmpty Map<String, @Valid PurposePolicy> purposes) {

    public PurposePolicy policy(String purpose) {
        return Objects.requireNonNull(purposes.get(purpose), "허용되지 않은 업로드 용도: " + purpose);
    }

    /** 용도별 정책. allowedMimeTypes는 화이트리스트다 */
    public record PurposePolicy(
            @NotEmpty List<String> allowedMimeTypes,
            @NotEmpty List<String> allowedExtensions,
            @NotNull DataSize maxSize,

            /**
             * 이 용도에서 만들 변형. 원본은 항상 보존되며 여기 나열하지 않는다.
             * 예: profile -> [THUMB], attachment -> [THUMB, MEDIUM], document -> []
             * 비우면 변형을 만들지 않고 원본만 쓴다.
             */
            List<ImageVariant> variants) {

        public boolean allows(String mimeType) {
            return allowedMimeTypes.contains(mimeType);
        }
    }

    /**
     * 변형 정의. 축소만 하고 확대하지 않는다.
     * 변형 키는 원본 키에서 유도한다(prefix와 확장자 교체) - DB에 변형 키를 저장하지 않는다.
     */
    public enum ImageVariant {

        THUMB("thumb", 256, "webp"),      // 목록, 아바타
        MEDIUM("medium", 1024, "webp");   // 상세 화면

        private final String prefix;
        private final int shortSide;
        private final String format;

        ImageVariant(String prefix, int shortSide, String format) {
            this.prefix = prefix;
            this.shortSide = shortSide;
            this.format = format;
        }

        public int shortSide() {
            return shortSide;
        }

        public String format() {
            return format;
        }

        /** profile/origin/2026/09/15/<uuid>.jpg -> profile/thumb/2026/09/15/<uuid>.webp */
        public String keyOf(String originKey) {
            return originKey
                    .replaceFirst("/origin/", "/" + prefix + "/")
                    .replaceFirst("\\.[^.]+$", "." + format);
        }

        /** 원본이 이미 작으면 만들지 않는다. 확대는 화질만 나빠지고 용량은 는다 */
        public boolean appliesTo(int originShortSide) {
            return originShortSide > shortSide;
        }
    }
}
