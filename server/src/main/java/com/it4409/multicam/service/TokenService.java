package com.it4409.multicam.service;

import com.it4409.multicam.entity.RefreshToken;
import com.it4409.multicam.entity.UserAccount;
import com.it4409.multicam.exception.ApiException;
import com.it4409.multicam.repository.RefreshTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TokenService {
    public static final long ACCESS_TOKEN_SECONDS = 3600;
    private static final long REFRESH_TOKEN_DAYS = 30;

    private final JwtEncoder jwtEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenService(JwtEncoder jwtEncoder, RefreshTokenRepository refreshTokenRepository) {
        this.jwtEncoder = jwtEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public TokenPair issue(UserAccount user) {
        Instant now = Instant.now();
        String accessToken = createAccessToken(user, now);
        String refreshToken = createOpaqueToken();
        refreshTokenRepository.save(new RefreshToken(
                UUID.randomUUID().toString(),
                user.getId(),
                hash(refreshToken),
                now.plus(REFRESH_TOKEN_DAYS, ChronoUnit.DAYS),
                false));
        return new TokenPair(accessToken, refreshToken);
    }

    @Transactional
    public TokenPair rotate(String rawRefreshToken, UserAccount user) {
        RefreshToken current = refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .filter(token -> !token.isRevoked() && token.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ApiException("2001", "Refresh token không hợp lệ hoặc đã hết hạn.", HttpStatus.UNAUTHORIZED));
        current.revoke();
        refreshTokenRepository.save(current);
        return issue(user);
    }

    public String resolveRefreshUserId(String rawRefreshToken) {
        return refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .filter(token -> !token.isRevoked() && token.getExpiresAt().isAfter(Instant.now()))
                .map(RefreshToken::getUserId)
                .orElseThrow(() -> new ApiException("2001", "Refresh token không hợp lệ hoặc đã hết hạn.", HttpStatus.UNAUTHORIZED));
    }

    public String createAccessToken(UserAccount user, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("multicam-server")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(ACCESS_TOKEN_SECONDS))
                .subject(user.getId())
                .claim("acc", user.getRole())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private String createOpaqueToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    public record TokenPair(String accessToken, String refreshToken) {
    }
}
