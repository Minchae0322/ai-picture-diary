package com.jellydiary.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jellydiary.common.util.Sha256;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class Sha256Test {

    @Test
    @DisplayName("같은 값은 늘 같은 해시다 - 기기가 다시 물어도 같은 번호를 받아야 한다")
    void stable() {
        String uuid = "8f14e45f-ea8d-4c1b-9f2a-1d0c0b7a5e31";

        assertThat(Sha256.hex(uuid)).isEqualTo(Sha256.hex(uuid));
        assertThat(Sha256.hex(uuid)).isNotEqualTo(Sha256.hex(uuid + "0"));
    }

    @Test
    @DisplayName("길이 64 소문자 hex. DDL 의 char(64) 와 같은 값이다")
    void shape() {
        String hash = Sha256.hex("device");

        assertThat(hash).hasSize(64).matches("[0-9a-f]{64}");
    }

    @Test
    @DisplayName("알려진 값으로 검증한다 - 구현을 바꿔도 결과가 흔들리지 않게")
    void knownVector() {
        // echo -n "abc" | shasum -a 256
        assertThat(Sha256.hex("abc"))
                .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    @Test
    @DisplayName("빈 값은 해시하지 않는다 - 모든 빈 기기가 같은 사용자가 된다")
    void rejectsBlank() {
        assertThatThrownBy(() -> Sha256.hex("  ")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Sha256.hex(null)).isInstanceOf(IllegalArgumentException.class);
    }
}
