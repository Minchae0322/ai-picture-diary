# file-upload-storage - 참고

SKILL.md의 절 번호와 같은 순서.

## 0. 저장소 선택

| | AWS S3 | Cloudflare R2 | MinIO(자체 호스팅) |
|---|---|---|---|
| API | S3 | S3 호환 | S3 호환 |
| 전송 비용(egress) | 있음 | 없음(정책 확인 필요) | 자체 회선 |
| 운영 부담 | 없음 | 없음 | 있음(디스크, 백업, 이중화) |
| 적합 | AWS 위주 | 다운로드가 많은 서비스 | 폐쇄망, 사내 시스템 |

세 곳 모두 S3 API를 쓰므로 **AWS SDK for Java v2 하나로 코드가 같다.** 엔드포인트와 자격증명만 설정으로 바꾼다. 그래서 처음부터 `StorageClient` 인터페이스로 감싸 두면 나중에 옮기기 쉽다.

가격·정책은 자주 바뀌므로 도입 시점에 각 사 공식 페이지에서 확인한다. 위 표는 구조적 차이만 담은 것이다.

## 1. presigned 업로드

### 발급

```java
@PostMapping("/api/v1/uploads")
UploadTicket issue(@RequestBody @Valid UploadRequest request, @AuthenticationPrincipal Long userId) {
    fileValidator.validateRequest(request);               // 타입 화이트리스트, 크기 상한

    String key = keyGenerator.generate(request.purpose(), request.extension());
    StoredFile file = fileRepository.save(StoredFile.pending(userId, key, request));

    PutObjectRequest put = PutObjectRequest.builder()
            .bucket(properties.bucket())
            .key(key)
            .contentType(request.mimeType())
            .contentLength(request.size())                 // 크기 고정
            .build();

    PresignedPutObjectRequest presigned = presigner.presignPutObject(b -> b
            .signatureDuration(Duration.ofMinutes(10))
            .putObjectRequest(put));

    return new UploadTicket(file.getId(), presigned.url().toString(), presigned.expiration());
}
```

`contentLength`와 `contentType`을 서명에 포함하면 클라이언트가 다른 크기/타입으로 올릴 수 없다. 더 강하게 제한하려면 POST 정책(presigned POST)으로 크기 범위를 지정한다.

### 완료 통보

```java
@PostMapping("/api/v1/uploads/{fileId}/complete")
FileResponse complete(@PathVariable Long fileId,
                      @RequestHeader("Idempotency-Key") String idempotencyKey,
                      @AuthenticationPrincipal Long userId) {

    StoredFile file = fileRepository.findById(fileId).orElseThrow(FileNotFoundException::new);
    file.requireOwnedBy(userId);

    // 실제 존재 확인 - 생략하면 없는 파일이 READY가 된다
    HeadObjectResponse head;
    try {
        head = s3.headObject(b -> b.bucket(properties.bucket()).key(file.getStorageKey()));
    } catch (NoSuchKeyException e) {
        throw new UploadNotFoundException(fileId);
    }

    fileValidator.validateStored(head, file);              // 크기, Content-Type 재확인
    file.markReady(head.contentLength(), head.eTag());

    imageProcessingPublisher.publishAfterCommit(file.getId());   // 커밋 후 비동기 (4장)
    return FileResponse.from(file);
}
```

### 상태 전이

```
PENDING --(complete)--> READY --(연결)--> LINKED
   |                      |                  |
   +---(만료 배치)---------+------------------+---> DELETING --(유예 후 배치)--> 삭제
```

- `PENDING`: URL만 발급됨. N시간 후 정리 대상.
- `READY`: 스토리지에 있으나 어떤 엔티티에도 연결 안 됨. N일 후 정리 대상.
- `LINKED`: 게시글 등에 연결됨. 정리 대상 아님.
- `DELETING`: 소프트 삭제됨. 유예 기간 후 실제 삭제.

## 2. 검증

### 파일 시그니처

```java
private static final Map<String, List<byte[]>> SIGNATURES = Map.of(
        "image/jpeg", List.of(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}),
        "image/png",  List.of(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}),
        "image/gif",  List.of("GIF87a".getBytes(US_ASCII), "GIF89a".getBytes(US_ASCII)),
        "image/webp", List.of("RIFF".getBytes(US_ASCII)),          // 8바이트 뒤 WEBP 추가 확인
        "application/pdf", List.of("%PDF-".getBytes(US_ASCII))
);

boolean matches(byte[] head, String declaredMime) {
    List<byte[]> candidates = SIGNATURES.get(declaredMime);
    return candidates != null && candidates.stream()
            .anyMatch(sig -> Arrays.equals(head, 0, sig.length, sig, 0, sig.length));
}
```

presigned 방식에서는 서버가 내용을 안 보므로, 완료 통보 시 앞부분 몇 KB만 `GetObject`의 Range 요청으로 읽어 확인한다.

```java
ResponseBytes<GetObjectResponse> head = s3.getObjectAsBytes(b -> b
        .bucket(bucket).key(key).range("bytes=0-1023"));
```

라이브러리를 쓴다면 Apache Tika가 시그니처 판별을 더 넓게 커버한다. 의존성을 추가할 만한지 판단한다.

### 화이트리스트 설정

```yaml
app:
  storage:
    bucket: ${STORAGE_BUCKET}
    endpoint: ${STORAGE_ENDPOINT:}          # R2/MinIO면 지정, AWS면 비움
    purposes:
      profile:
        allowed-mime-types: [image/jpeg, image/png, image/webp]
        max-size: 5MB
      attachment:
        allowed-mime-types: [image/jpeg, image/png, application/pdf]
        max-size: 20MB
```

### 파일명

```java
String generate(String purpose, String extension) {
    String safeExt = ALLOWED_EXTENSIONS.contains(extension.toLowerCase(Locale.ROOT))
            ? extension.toLowerCase(Locale.ROOT)
            : "bin";
    LocalDate today = LocalDate.now(KST);
    return "%s/origin/%d/%02d/%02d/%s.%s".formatted(
            purpose, today.getYear(), today.getMonthValue(), today.getDayOfMonth(),
            UUID.randomUUID(), safeExt);
}
```

원본 파일명은 `tb_file.original_name`에만 저장한다. 다운로드 시 헤더로 돌려준다(6장).

## 4. 원본과 파생물

### 변형 정의

크기를 코드 여기저기서 정하지 않고 한곳에 열거한다.

```java
public enum ImageVariant {

    //        prefix     짧은 변  포맷   비고
    THUMB    ("thumb",    256,  "webp"),   // 목록, 아바타
    MEDIUM   ("medium",  1024,  "webp"),   // 상세 화면
    ORIGIN   ("origin",     0,  null);     // 원본. 변환하지 않는다

    private final String prefix;
    private final int shortSide;           // 0이면 변환 없음
    private final String format;

    /** 원본 키에서 변형 키를 유도한다. DB에 변형 키를 따로 저장하지 않아도 된다 */
    public String keyOf(String originKey) {
        if (this == ORIGIN) return originKey;
        // profile/origin/2026/09/15/<uuid>.jpg -> profile/thumb/2026/09/15/<uuid>.webp
        return originKey
                .replaceFirst("/origin/", "/" + prefix + "/")
                .replaceFirst("\\.[^.]+$", "." + format);
    }
}
```

키를 규칙으로 유도하면 변형이 늘어도 DB 스키마가 안 바뀐다. 대신 **"그 변형이 실제로 만들어졌는지"** 는 알 수 없으므로, 생성 완료 상태를 파일 행에 비트/목록으로 남긴다(`variants_ready`).

### 생성

```java
@TransactionalEventListener(phase = AFTER_COMMIT)
void on(FileReadyEvent event) {
    imageQueue.enqueue(event.fileId());          // 업로드 응답을 막지 않는다
}

void generateVariants(Long fileId) {
    StoredFile file = fileRepository.findById(fileId).orElseThrow();

    try (var in = s3.getObject(b -> b.bucket(bucket).key(file.getStorageKey()))) {
        ImageInputStream iis = ImageIO.createImageInputStream(in);
        ImageReader reader = firstReader(iis);
        int w = reader.getWidth(0), h = reader.getHeight(0);

        if ((long) w * h > properties.maxPixels()) {          // decompression bomb
            throw new ImageTooLargeException((long) w * h);
        }
        int shortSide = Math.min(w, h);

        List<ImageVariant> made = new ArrayList<>();
        for (ImageVariant variant : properties.variantsOf(file.getPurpose())) {
            if (variant == ImageVariant.ORIGIN) continue;

            // 축소만 한다. 원본이 더 작으면 건너뛴다 - 확대는 화질만 나빠진다
            if (shortSide <= variant.shortSide()) continue;

            BufferedImage resized = resizeKeepingRatio(reader, variant.shortSide());   // EXIF Orientation 적용 후 메타 제거
            s3.putObject(
                    b -> b.bucket(bucket)
                          .key(variant.keyOf(file.getStorageKey()))     // 원본과 다른 키
                          .contentType("image/" + variant.format()),
                    RequestBody.fromBytes(encode(resized, variant.format())));
            made.add(variant);
        }
        file.markVariantsReady(made);            // 원본 키는 건드리지 않는다
    }
}
```

핵심은 셋이다.

1. **원본 키에 쓰지 않는다.** `putObject`의 키가 항상 `variant.keyOf(...)`다. 원본을 리사이즈 결과로 덮어쓰면 되돌릴 방법이 없다.
2. **원본이 더 작으면 건너뛴다.** 256짜리 프로필 사진을 1024로 늘려 저장하면 용량만 늘고 화질은 나빠진다. 화면에서는 그 변형이 없으면 원본으로 폴백한다.
3. **원본 행의 메타는 그대로 두고** 생성된 변형 목록만 기록한다.

### 화면에서 고르기

```java
String urlFor(StoredFile file, ImageVariant wanted) {
    ImageVariant actual = file.hasVariant(wanted) ? wanted : ImageVariant.ORIGIN;
    return presign(actual.keyOf(file.getStorageKey()));
}
```

변형이 아직 안 만들어졌거나(비동기 지연) 원본이 작아서 건너뛰었을 때 자연스럽게 원본으로 떨어진다.

### 재생성

크기 정책이 바뀌거나 변형이 유실되면 원본에서 다시 만든다. 원본을 보관하는 이유가 이것이다.

```java
// batch-and-scheduler 규칙: 청크 단위, 재실행 안전
// 대상: variants_ready 에 새 변형이 없는 파일
// 원본이 없으면(keepOrigin=false로 운영한 기간) 재생성 불가 - 그래서 기본이 보관이다
```

`ImageVariant`에 값을 추가하고 이 배치를 돌리면 전체가 채워진다. 반대로 변형을 없애면 해당 prefix를 스토리지 수명주기 규칙이나 정리 배치로 지운다. **원본은 어느 경우에도 지우지 않는다.**

### 미리 만들기 vs 요청 시 생성

| | 미리 생성(pre-generate) | 요청 시 생성(on-the-fly) |
|---|---|---|
| 변형 수 | 2~3종 고정 | 여러 종, 자주 바뀜 |
| 첫 요청 지연 | 없음 | 있음(이후 CDN 캐시) |
| 저장 용량 | 안 쓰는 변형도 차지 | 요청된 것만 |
| 구현 | 직접 | 이미지 서비스/CDN 기능에 위임 |

변형이 3종을 넘거나 크기가 자주 바뀌면 요청 시 생성으로 간다. 어느 쪽이든 **원본 보관과 원본 불변**은 같다.

## 5. 정리 배치

```java
// 1. PENDING 만료 (URL 발급 후 24시간)
@Scheduled(cron = "${app.batch.file-pending-cleanup.cron}", zone = "Asia/Seoul")
@SchedulerLock(name = "file-pending-cleanup", lockAtMostFor = "20m")
void cleanupPending() {
    // status = PENDING and created_at < now() - 24h
    // 스토리지에 있으면 삭제, 없으면 행만 삭제
}

// 2. 미연결 READY 만료 (7일)
// 3. DELETING 실제 삭제 (소프트 삭제 후 30일)
```

- 셋 다 청크 단위로 돌고 재실행에 안전해야 한다(`batch-and-scheduler` 4장, 6장).
- 삭제는 DB 먼저가 아니라 **스토리지 먼저 지우고 DB 행을 지운다.** 순서를 반대로 하면 DB 행이 없어져 스토리지 고아를 찾을 수 없다.
- 스토리지 수명주기 규칙으로 `tmp/` prefix를 자동 만료시키면 1번 배치를 대체할 수 있다.

```java
// 엔티티 삭제 시 첨부도 표시
@Transactional
public void deleteArticle(Long articleId) {
    Article article = articleRepository.findById(articleId).orElseThrow();
    article.markDeleted(Instant.now());
    fileRepository.markDeletingByArticleId(articleId);   // 실제 삭제는 배치가
}
```

## 6. 다운로드

```java
@GetMapping("/api/v1/files/{fileId}/download-url")
DownloadUrl downloadUrl(@PathVariable Long fileId, @AuthenticationPrincipal Long userId) {
    StoredFile file = fileRepository.findReadyById(fileId).orElseThrow(FileNotFoundException::new);
    fileAccessPolicy.requireReadable(file, userId);        // 발급 시점 권한 검사

    GetObjectRequest get = GetObjectRequest.builder()
            .bucket(bucket).key(file.getStorageKey())
            .responseContentDisposition(contentDisposition(file.getOriginalName()))
            .build();

    PresignedGetObjectRequest presigned = presigner.presignGetObject(b -> b
            .signatureDuration(Duration.ofMinutes(5))
            .getObjectRequest(get));

    return new DownloadUrl(presigned.url().toString(), presigned.expiration());
}

// 한글 파일명 - RFC 5987
private String contentDisposition(String filename) {
    String encoded = URLEncoder.encode(filename, UTF_8).replace("+", "%20");
    return "attachment; filename=\"file\"; filename*=UTF-8''" + encoded;
}
```

- presigned GET URL은 **발급받은 사람이 공유하면 유효기간 동안 누구나 받을 수 있다.** 민감한 파일은 유효기간을 매우 짧게 하고 매번 발급한다.
- 업로드된 콘텐츠를 애플리케이션과 같은 도메인에서 서빙하면 XSS 경로가 된다. 별도 도메인(예: `files.example.com`)을 쓰거나 항상 `Content-Disposition: attachment`로 내려준다.

## 참고

- AWS SDK for Java v2 - Presigned URLs: https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3-presign.html
- OWASP - File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- RFC 5987 (헤더 파일명 인코딩): https://datatracker.ietf.org/doc/html/rfc5987
