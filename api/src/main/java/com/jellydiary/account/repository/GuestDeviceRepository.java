package com.jellydiary.account.repository;

import com.jellydiary.account.domain.GuestDevice;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestDeviceRepository extends JpaRepository<GuestDevice, Long> {

    Optional<GuestDevice> findByDeviceHash(String deviceHash);

    boolean existsById(Long id);
}
