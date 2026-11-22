package com.it4409.multicam.repository;

import com.it4409.multicam.entity.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);
    Optional<UserAccount> findByPhone(String phone);
    boolean existsByRole(String role);
}
