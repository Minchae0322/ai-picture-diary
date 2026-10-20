# 멀티스테이지 JVM 이미지.
# 원칙: 빌드 도구를 런타임에 남기지 않는다, 레이어 캐시를 살린다, 비 root로 실행한다.
# 베이스 이미지 태그는 재현성을 위해 다이제스트로 고정하는 것을 권장한다.
#   FROM eclipse-temurin:25-jdk@sha256:...

# ---------- 빌드 ----------
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /build

# 변경 빈도가 낮은 것부터: 의존성 레이어를 재사용한다
COPY gradle/ gradle/
COPY gradlew settings.gradle.kts build.gradle.kts ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

# 소스는 나중에 (자주 바뀐다)
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# 레이어드 JAR 추출 - 의존성/애플리케이션을 분리해 푸시 크기를 줄인다
# jarmode 옵션 이름은 Boot 버전마다 다르다. 사용 중인 버전 문서를 확인할 것.
#   Boot 3.x: -Djarmode=layertools
#   Boot 4.x: -Djarmode=tools ... extract --layers
WORKDIR /build/extracted
RUN java -Djarmode=tools -jar /build/build/libs/*.jar extract --layers --launcher

# ---------- 런타임 ----------
FROM eclipse-temurin:25-jre
WORKDIR /app

# 비 root 사용자
RUN groupadd -r app && useradd -r -g app app

# 레이어 순서대로 복사 (변경 빈도 낮은 것부터)
COPY --from=builder --chown=app:app /build/extracted/*/dependencies/ ./
COPY --from=builder --chown=app:app /build/extracted/*/spring-boot-loader/ ./
COPY --from=builder --chown=app:app /build/extracted/*/snapshot-dependencies/ ./
COPY --from=builder --chown=app:app /build/extracted/*/application/ ./

USER app
EXPOSE 8080

# 컨테이너 메모리 한도를 JVM이 인식한다 (기본 동작이지만 명시)
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -Duser.timezone=Asia/Seoul"

# 프로파일과 시크릿은 런타임 환경변수로 주입한다 (config-and-secrets)
# 이미지에는 어떤 시크릿도 넣지 않는다.

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
