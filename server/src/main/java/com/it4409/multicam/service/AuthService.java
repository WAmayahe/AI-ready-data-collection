package com.it4409.multicam.service;

import com.it4409.multicam.dto.LoginRequest;
import com.it4409.multicam.dto.LoginResponse;
import com.it4409.multicam.entity.DeviceRecord;
import com.it4409.multicam.entity.UserAccount;
import com.it4409.multicam.exception.ApiException;
import com.it4409.multicam.repository.DeviceRecordRepository;
import com.it4409.multicam.repository.UserAccountRepository;
import java.time.Instant;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthService {
    private final UserAccountRepository userRepository;
    private final DeviceRecordRepository deviceRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(
            UserAccountRepository userRepository,
            DeviceRecordRepository deviceRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService) {
        this.userRepository = userRepository;
        this.deviceRepository = deviceRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        boolean hasEmail = StringUtils.hasText(request.email());
        boolean hasPhone = StringUtils.hasText(request.phone());
        if (hasEmail == hasPhone) {
            throw new ApiException("1002", "Cần cung cấp chính xác email hoặc số điện thoại.", HttpStatus.BAD_REQUEST);
        }
        if (!isSupportedDeviceType(request.deviceType())) {
            throw new ApiException("1003", "device_type phải là 1, 2 hoặc 4.", HttpStatus.BAD_REQUEST);
        }

        UserAccount user = (hasEmail
                ? userRepository.findByEmailIgnoreCase(request.email().trim())
                : userRepository.findByPhone(request.phone().trim()))
                .orElseThrow(() -> new ApiException("1004", "Tài khoản không tồn tại.", HttpStatus.UNAUTHORIZED));

        if (!user.isActive()) {
            throw new ApiException("1006", "Tài khoản đã bị khóa.", HttpStatus.FORBIDDEN);
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException("1005", "Sai mật khẩu.", HttpStatus.UNAUTHORIZED);
        }

        Instant now = Instant.now();
        DeviceRecord device = deviceRepository.findById(request.deviceId())
                .map(existing -> {
                    if (!existing.getUserId().equals(user.getId())) {
                        throw new ApiException("1009", "device_id đã được liên kết với tài khoản khác.", HttpStatus.CONFLICT);
                    }
                    existing.update(request.deviceName().trim(), now);
                    return existing;
                })
                .orElseGet(() -> new DeviceRecord(
                        request.deviceId(),
                        user.getId(),
                        request.deviceType(),
                        request.deviceName().trim(),
                        request.deviceName().trim(),
                        now));
        deviceRepository.save(device);

        TokenService.TokenPair tokens = tokenService.issue(user);
        return new LoginResponse(
                new LoginResponse.UserSummary(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail(),
                        user.getPhone()),
                user.getRole().toLowerCase(Locale.ROOT),
                tokens.accessToken(),
                tokens.refreshToken(),
                TokenService.ACCESS_TOKEN_SECONDS,
                new LoginResponse.DeviceSummary(device.getId(), device.getCameraName()));
    }

    @Transactional
    public RefreshResponse refresh(String rawRefreshToken) {
        String userId = tokenService.resolveRefreshUserId(rawRefreshToken);
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("2001", "Tài khoản của refresh token không còn tồn tại.", HttpStatus.UNAUTHORIZED));
        TokenService.TokenPair tokens = tokenService.rotate(rawRefreshToken, user);
        return new RefreshResponse(tokens.accessToken(), tokens.refreshToken(), TokenService.ACCESS_TOKEN_SECONDS);
    }

    private boolean isSupportedDeviceType(Integer deviceType) {
        return deviceType != null && (deviceType == 1 || deviceType == 2 || deviceType == 4);
    }

    public record RefreshResponse(String accessToken, String refreshToken, long expiresIn) {
    }
}
