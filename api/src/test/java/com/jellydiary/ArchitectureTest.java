package com.jellydiary;

import static com.tngtech.archunit.base.DescribedPredicate.alwaysTrue;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.properties.HasAnnotations.Predicates.annotatedWith;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.Entity;                       // Boot 2.x는 javax.persistence.Entity
import jakarta.persistence.MappedSuperclass;
import lombok.Data;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.Repository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;

/**
 * ddd-spring 스킬 + 프로젝트 스킬 4-1장 규칙의 ArchUnit 버전. 두 문서는 같은 규칙을 말해야 한다.
 * 기존 프로젝트는 FreezingArchRule.freeze(rule)로 감싸 현재 위반은 저장하고 새 위반만 막는다.
 *
 * <p>도메인 안쪽은 네 패키지로 나뉜다. 의존 방향 관점에서는 전부 같은 "domain" 층이다.
 * <pre>
 *   domain/  엔티티(테이블)만   type/   enum·값 객체
 *   event/   도메인 이벤트      util/   순수 계산(common)
 * </pre>
 *
 * <p>모델 연동은 업무 도메인이 아니라 기술 컨텍스트 <code>com.jellydiary.llm</code>에 모여 있다
 * (계약 인터페이스까지 함께). 그래서 llm 은 도메인 어휘를 참조해도 되고(3번 예외), 대신 업무 흐름을
 * 되부르지 못한다(11번).
 */
@AnalyzeClasses(packages = "com.jellydiary", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    private static final String[] DOMAIN_PACKAGES = {
        "..domain..", "..type..", "..event..", "..util.."
    };

    // 1. 계층 의존 방향: controller -> service -> repository -> domain(어댑터 포함)
    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringOnlyDependenciesInLayers()
        .layer("controller").definedBy("..controller..")
        .layer("service").definedBy("..service..")
        .layer("repository").definedBy("..repository..")
        .layer("domain").definedBy(DOMAIN_PACKAGES)
        .whereLayer("controller").mayNotBeAccessedByAnyLayer()
        .whereLayer("service").mayOnlyBeAccessedByLayers("controller")
        .whereLayer("repository").mayOnlyBeAccessedByLayers("service")
        .whereLayer("domain").mayOnlyBeAccessedByLayers("service", "repository", "controller");

    // 2. 도메인 안쪽은 상위 계층과 외부 시스템을 모른다
    @ArchTest
    static final ArchRule domainIsolation = noClasses().that().resideInAnyPackage(DOMAIN_PACKAGES)
        .should().dependOnClassesThat().resideInAnyPackage(
            "..controller..", "..service..", "..repository..", "..config..",
            "org.springframework.web..", "org.springframework.kafka..", "org.apache.kafka..");

    /**
     * 3. 도메인 간 직접 참조 금지 (community.domain -> diary.type).
     *
     * <p>예외 셋: 조합은 service 에서만 한다. common·llm 은 업무 도메인이 아니라 <b>기술 컨텍스트</b>라
     * 누가 참조해도 되고, llm 자신은 도메인 어휘(Weather 등)를 계약에 담아야 해서 반대 방향도 허용한다.
     * 대신 llm 이 업무 흐름을 되부르는 것은 11번이 막는다.
     */
    @ArchTest
    static final ArchRule noCrossDomain = slices().matching("com.jellydiary.(*)..")
        .should().notDependOnEachOther()
        .ignoreDependency(resideInAPackage("..service.."), alwaysTrue())
        .ignoreDependency(alwaysTrue(), resideInAPackage("com.jellydiary.common.."))
        .ignoreDependency(alwaysTrue(), resideInAPackage("com.jellydiary.llm.."))
        .ignoreDependency(resideInAPackage("com.jellydiary.llm.."), alwaysTrue());

    // 4. domain 에는 테이블만 (프로젝트 스킬 4-1장)
    @ArchTest
    static final ArchRule domainHoldsOnlyEntities = classes().that().resideInAPackage("..domain..")
        .should().beAnnotatedWith(Entity.class)
        .orShould().beAnnotatedWith(MappedSuperclass.class)
        .because("domain 은 테이블 1:1이다. enum·값 객체는 type, 이벤트는 event, 포트는 port, 순수 계산은 util");

    // 5. 순수 계산 클래스는 상태가 없다 (util 패키지 + Utils 접미사 둘 다)
    @ArchTest
    static final ArchRule utilShape = classes().that()
        .resideInAPackage("..util..").and().areTopLevelClasses()
        .or().haveSimpleNameEndingWith("Utils")
        .should().haveOnlyPrivateConstructors()
        .andShould().haveModifier(JavaModifier.FINAL)
        .andShould().notBeAnnotatedWith(Component.class);

    // 6. 엔티티에 @Setter / @Data 금지
    @ArchTest
    static final ArchRule noSetterOnEntity = noClasses().that().areAnnotatedWith(Entity.class)
        .should().beAnnotatedWith(Setter.class).orShould().beAnnotatedWith(Data.class);

    // 7. @Transactional은 service에만 (도메인 안쪽/컨트롤러 금지)
    @ArchTest
    static final ArchRule transactionalOnlyInApplication = noClasses().that()
        .resideInAnyPackage("..domain..", "..type..", "..event..", "..util..", "..controller..")
        .should().beAnnotatedWith(Transactional.class)
        .orShould().containAnyMethodsThat(annotatedWith(Transactional.class));

    // 8. 컨트롤러는 엔티티를 반환하지 않는다
    @ArchTest
    static final ArchRule noEntityInController = noMethods().that()
        .areDeclaredInClassesThat().areAnnotatedWith(RestController.class)
        .should().haveRawReturnType(annotatedWith(Entity.class));

    // 9. 컨트롤러는 리포지토리를 직접 쓰지 않는다
    @ArchTest
    static final ArchRule noRepositoryInController = noClasses().that().areAnnotatedWith(RestController.class)
        .should().dependOnClassesThat().areAssignableTo(Repository.class);

    // 10. 필드 주입 금지
    @ArchTest
    static final ArchRule noFieldInjection = noFields().should().beAnnotatedWith(Autowired.class);

    // 11. llm 컨텍스트는 도메인 어휘만 본다. 업무 흐름(컨트롤러/서비스/리포지토리)을 되부르지 않는다
    @ArchTest
    static final ArchRule llmDoesNotCallBack = noClasses().that().resideInAPackage("com.jellydiary.llm..")
        .should().dependOnClassesThat().resideInAnyPackage("..controller..", "..service..", "..repository..");
}
