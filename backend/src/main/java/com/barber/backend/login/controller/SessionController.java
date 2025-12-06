package com.barber.backend.login.controller;

import com.barber.backend.login.service.JwtService;
import com.barber.backend.login.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class SessionController {

    private final RefreshTokenService refreshService;
    private final JwtService jwt;
    private final boolean cookieSecure;
    private final String cookieSameSite;
    private final String cookiePath;
    private final String cookieDomain;
    private final long refreshTtlSeconds;

    public SessionController(
            RefreshTokenService refreshService,
            JwtService jwt,
            @Value("${app.cookies.secure:false}") boolean cookieSecure,
            @Value("${app.cookies.same-site:Lax}") String cookieSameSite,
            @Value("${app.cookies.path:/}") String cookiePath,
            @Value("${app.cookies.domain:}") String cookieDomain,
            @Value("${jwt.refresh.ttl-seconds:2592000}") long refreshTtlSeconds
    ) {
        this.refreshService = refreshService;
        this.jwt = jwt;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
        this.cookiePath = cookiePath;
        this.cookieDomain = cookieDomain;
        this.refreshTtlSeconds = refreshTtlSeconds;
    }

    /*
     * ==========================
     * Helpers para la cookie
     * ==========================
     */

    // Ajusta secure/SameSite según tu despliegue (ver notas abajo)
    private void setRefreshCookie(HttpServletResponse res, String rawRefresh) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("refresh_token", rawRefresh)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookiePath)
                .maxAge(refreshTtlSeconds);

        if (StringUtils.hasText(cookieDomain)) {
            builder.domain(cookieDomain);
        }

        ResponseCookie cookie = builder.build();
        res.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse res) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookiePath)
                .maxAge(0);

        if (StringUtils.hasText(cookieDomain)) {
            builder.domain(cookieDomain);
        }

        ResponseCookie cookie = builder.build();
        res.addHeader("Set-Cookie", cookie.toString());
    }

    /**
     * Llama a este helper DESPUÉS de un login exitoso (Google/Facebook/OTP) para
     * setear la cookie
     * 
     * @param req
     */
    public void attachRefreshCookie(HttpServletRequest req, HttpServletResponse res, Long uid) {
        String refreshRaw = refreshService.issue(uid, req.getHeader("User-Agent"), req.getRemoteAddr());
        setRefreshCookie(res, refreshRaw);
    }

    /*
     * ==========================
     * Endpoints de sesión
     * ==========================
     */

    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<?> refresh(
            @CookieValue(value = "refresh_token", required = false) String refreshCookie,
            HttpServletRequest req,
            HttpServletResponse res) {
        if (refreshCookie == null || refreshCookie.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("ok", false, "error", "No refresh token"));
        }

        // 1) Validar firma/exp y extraer uid
        Long uid;
        try {
            uid = refreshService.verifyAndGetUid(refreshCookie);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("ok", false, "error", "Refresh inválido"));
        }

        // 2) Rotar el refresh actual y reescribir cookie
        refreshService.revoke(refreshCookie);
        String newRefresh = refreshService.issue(uid, req.getHeader("User-Agent"), req.getRemoteAddr());
        setRefreshCookie(res, newRefresh);

        // 3) Emitir nuevo access token corto
        String access = jwt.issue(uid, "user-" + uid, List.of("USER"));

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "accessToken", access));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(value = "refresh_token", required = false) String refreshCookie,
            HttpServletResponse res) {
        if (StringUtils.hasText(refreshCookie)) {
            refreshService.revoke(refreshCookie);
        }

        clearRefreshCookie(res);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}