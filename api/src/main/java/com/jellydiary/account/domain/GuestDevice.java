package com.jellydiary.account.domain;

import com.jellydiary.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * 로그인하지 않은 기기 하나. <b>이 행의 id 가 곧 사용자 번호다.</b>
 *
 * <p>인증이 붙는 날 {@code tb_user} 가 생기고 이 엔티티에는 그것을 가리키는 컬럼이 더해진다. 오늘 그 둘이 같은 값이라서, 게스트가 나중에 로그인해도 사용자
 * 번호가 바뀌지 않는다 - 로그인 시 기록을 병합하는 규칙이 아예 필요 없다(ADR 2026-10-20).
 *
 * <p>기기 UUID 원문은 담지 않는다. SHA-256 만 둔다.
 */
@Getter
@Entity
@Table(name = "tb_guest_device")
@SQLDelete(sql = "UPDATE tb_guest_device SET deleted_at = now(6) WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GuestDevice extends BaseEntity {

    /** DDL 의 char(64) 와 같은 값. SHA-256 을 소문자 hex 로 적은 길이다. */
    public static final int HASH_COLUMN_LENGTH = 64;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
      columnDefinition 이 없으면 하이버네이트가 varchar(64) 를 기대해 ddl-auto: validate 가 깨진다.
      DDL 은 길이가 고정이라 일부러 char 를 골랐으므로(패치 파일 주석) 엔티티가 그쪽에 맞춘다 -
      스키마의 진실은 sql/patch 파일이다(ADR 2026-10-24-로컬-DB-실행-허용).
      패치를 한 번도 실행한 적이 없어 2026-10-24 에 처음 띄워 볼 때까지 드러나지 않았다.
    */
    @Column(
            nullable = false,
            length = HASH_COLUMN_LENGTH,
            columnDefinition = "char(" + HASH_COLUMN_LENGTH + ")")
    private String deviceHash;

    private GuestDevice(String deviceHash) {
        this.deviceHash = deviceHash;
    }

    public static GuestDevice of(String deviceHash) {
        if (deviceHash == null || deviceHash.length() != HASH_COLUMN_LENGTH) {
            throw new IllegalArgumentException("기기 해시는 SHA-256 hex 여야 한다");
        }
        return new GuestDevice(deviceHash);
    }
}
