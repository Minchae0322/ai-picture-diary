package com.jellydiary;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.properties.HasAnnotations.Predicates.annotatedWith;
import static com.tngtech.archunit.base.DescribedPredicate.alwaysTrue;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.Entity;                       // Boot 2.x는 javax.persistence.Entity
import lombok.Data;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.Repository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;

/**
 * ddd-spring 스킬 규칙의 ArchUnit 버전. 두 문서는 같은 규칙을 말해야 한다.
 * 기존 프로젝트는 FreezingArchRule.freeze(rule)로 감싸 현재 위반은 저장하고 새 위반만 막는다.
 * 계층 패키지명이 controller/service/repository면 "..controller.." 등을 그에 맞게 바꾼다.
 */
@AnalyzeClasses(packages = "com.jellydiary", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    // 1. 계층 의존 방향: controller -> service -> repository -> domain, infrastructure -> domain
    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringOnlyDependenciesInLayers()
        .layer("controller").definedBy("..controller..")
        .layer("service").definedBy("..service..")
        .layer("repository").definedBy("..repository..")
        .layer("domain").definedBy("..domain..")
        .layer("infrastructure").definedBy("..infrastructure..")
        .whereLayer("controller").mayNotBeAccessedByAnyLayer()
        .whereLayer("service").mayOnlyBeAccessedByLayers("controller", "infrastructure")
        .whereLayer("repository").mayOnlyBeAccessedByLayers("service", "infrastructure")
        .whereLayer("domain").mayOnlyBeAccessedByLayers("service", "repository", "infrastructure", "controller")
        .whereLayer("infrastructure").mayNotBeAccessedByAnyLayer();

    // 2. domain은 상위 계층과 외부 시스템을 모른다
    @ArchTest
    static final ArchRule domainIsolation = noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAnyPackage(
            "..controller..", "..service..", "..repository..",
            "org.springframework.web..", "org.springframework.kafka..", "org.apache.kafka..");

    // 3. 도메인 간 직접 참조 금지 (order.domain -> member.domain)
    @ArchTest
    static final ArchRule noCrossDomain = slices().matching("com.jellydiary.(*)..")
        .should().notDependOnEachOther()
        .ignoreDependency(resideInAPackage("..service.."), alwaysTrue())   // application에서의 조합은 허용
        .ignoreDependency(alwaysTrue(), resideInAPackage("..common.."));

    // 4. 엔티티에 @Setter / @Data 금지
    @ArchTest
    static final ArchRule noSetterOnEntity = noClasses().that().areAnnotatedWith(Entity.class)
        .should().beAnnotatedWith(Setter.class).orShould().beAnnotatedWith(Data.class);

    // 5. @Transactional은 service에만 (도메인/컨트롤러 금지)
    @ArchTest
    static final ArchRule transactionalOnlyInApplication = noClasses().that()
        .resideInAnyPackage("..domain..", "..controller..")
        .should().beAnnotatedWith(Transactional.class)
        .orShould().containAnyMethodsThat(annotatedWith(Transactional.class));

    // 6. 컨트롤러는 엔티티를 반환하지 않는다
    @ArchTest
    static final ArchRule noEntityInController = noMethods().that()
        .areDeclaredInClassesThat().areAnnotatedWith(RestController.class)
        .should().haveRawReturnType(annotatedWith(Entity.class));

    // 7. 컨트롤러는 리포지토리를 직접 쓰지 않는다
    @ArchTest
    static final ArchRule noRepositoryInController = noClasses().that().areAnnotatedWith(RestController.class)
        .should().dependOnClassesThat().areAssignableTo(Repository.class);

    // 8. 필드 주입 금지
    @ArchTest
    static final ArchRule noFieldInjection = noFields().should().beAnnotatedWith(Autowired.class);

    // 9. Util 클래스는 final + private 생성자 + 스프링 빈 아님
    @ArchTest
    static final ArchRule utilShape = classes().that().haveSimpleNameEndingWith("Utils")
        .should().haveOnlyPrivateConstructors().andShould().haveModifier(JavaModifier.FINAL)
        .andShould().notBeAnnotatedWith(Component.class);
}
