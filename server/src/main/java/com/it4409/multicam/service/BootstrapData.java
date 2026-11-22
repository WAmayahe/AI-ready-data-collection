package com.it4409.multicam.service;

import com.it4409.multicam.entity.UserAccount;
import com.it4409.multicam.repository.UserAccountRepository;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BootstrapData implements CommandLineRunner {
    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String controllerEmail;
    private final String controllerPassword;
    private final String remoteEmail;
    private final String remotePassword;

    public BootstrapData(
            UserAccountRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.controller-email}") String controllerEmail,
            @Value("${app.bootstrap.controller-password:}") String controllerPassword,
            @Value("${app.bootstrap.remote-email}") String remoteEmail,
            @Value("${app.bootstrap.remote-password:}") String remotePassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.controllerEmail = controllerEmail;
        this.controllerPassword = controllerPassword;
        this.remoteEmail = remoteEmail;
        this.remotePassword = remotePassword;
    }

    @Override
    public void run(String... args) {
        createIfMissing("controller", controllerEmail, controllerPassword, "Controller");
        createIfMissing("remote", remoteEmail, remotePassword, "Remote");
    }

    private void createIfMissing(String role, String email, String rawPassword, String firstName) {
        if (userRepository.existsByRole(role)) {
            return;
        }
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalStateException(
                    "Thiếu mật khẩu khởi tạo cho " + role + ". Hãy đặt biến môi trường APP_BOOTSTRAP_"
                            + role.toUpperCase() + "_PASSWORD.");
        }
        userRepository.save(new UserAccount(
                "u_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
                email.trim().toLowerCase(),
                null,
                firstName,
                "Account",
                passwordEncoder.encode(rawPassword),
                role,
                true));
    }
}
