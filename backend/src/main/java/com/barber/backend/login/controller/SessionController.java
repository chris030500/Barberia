package com.barber.backend.login.controller;

import com.barber.backend.login.service.JwtService;
import com.barber.backend.login.service.RefreshTokenService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class SessionController {

    private final RefreshTokenService refreshService;
    private final JwtService jwt;

    public SessionController(RefreshTokenService refreshService, JwtService jwt) {
        this.refreshService = refreshService;
        this.jwt = jwt;
    }

    /*
     * ==========================
     * Helpers para la cookie
     * ==========================
     */

    // Ajusta secure/SameSite según tu despliegue (ver notas abajo)
    private void setRefreshCookie(HttpServletResponse res, String rawRefresh) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", rawRefresh)
                .httpOnly(true)
                .secure(false) // ⚠️ en PROD con HTTPS: true
                .sameSite("Lax") // ⚠️ si tu frontend está en otro dominio: "None" + secure=true
                .path("/auth")
                .maxAge(30L * 24 * 3600) // 30 días (coherente con tu ttl-seconds)
                .build();
        res.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse res) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false) // idem arriba
                .sameSite("Lax") // idem arriba
                .path("/auth")
                .maxAge(0)
                .build();
        res.addHeader("Set-Cookie", cookie.toString());
    }

    /**
     * Llama a este helper DESPUÉS de un login exitoso (Google/Facebook/OTP) para
     * setear la cookie
     * 
     * @param req
     */
    public void attachRefreshCookie(HttpServletRequest req, HttpServletResponse res, Long uid) {
        String refreshRaw = refreshService.issue(uid);
        setRefreshCookie(res, refreshRaw);
    }

    /*
     * ==========================
     * Endpoints de sesión
     * ==========================
     */

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(value = "refresh_token", required = false) String refreshCookie,
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

        // 2) (Opcional) Sliding expiration: emitir un refresh nuevo y reescribir cookie
        String newRefresh = refreshService.issue(uid);
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
        // Con el modelo stateless no hay “revocación” en servidor;
        // limpiar la cookie es suficiente a nivel cliente.
        // (Si en el futuro pasas a modelo stateful, aquí revocas en base de datos /
        // blacklist.)
        clearRefreshCookie(res);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}