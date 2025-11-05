package com.barber.backend.login.controller;

import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.service.GoogleService;
import com.barber.backend.login.service.UsuarioSocialService;
import com.barber.backend.login.service.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Login mediante Google:
 * 1) Recibe idToken del front
 * 2) Verifica con GoogleService
 * 3) Upsert de usuario
 * 4) Emite access token
 * 5) Setea refresh token en cookie HttpOnly
 */
@RestController
@RequestMapping("/auth")
public class GoogleAuthController {

    private final GoogleService googleService;
    private final UsuarioSocialService usuarioSocial;
    private final JwtService jwt;
    private final SessionController sessionHelper;

    public GoogleAuthController(GoogleService googleService,
                                UsuarioSocialService usuarioSocial,
                                JwtService jwt,
                                SessionController sessionHelper) {
        this.googleService = googleService;
        this.usuarioSocial = usuarioSocial;
        this.jwt = jwt;
        this.sessionHelper = sessionHelper;
    }

    @PostMapping(
        path = "/google",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> body,
                                             HttpServletRequest req,
                                             HttpServletResponse res) {
        try {
            // 1) Validar entrada
            String idToken = body.get("idToken");
            if (idToken == null || idToken.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "error", "idToken requerido"
                ));
            }

            // 2) Verificar token con Google (firma, audiencia, exp, etc.)
            var googleData = googleService.verify(idToken);

            // 3) Crear/actualizar usuario
            Usuario u = usuarioSocial.getOrCreateFromGoogle(googleData);

            // 4) Emitir access token (corto)
            String accessToken = jwt.issue(u.getId(), "user-" + u.getId(), List.of("USER"));

            // 5) Emitir refresh token y setear cookie HttpOnly (path=/auth)
            sessionHelper.attachRefreshCookie(req, res, u.getId());

            // 6) Responder al front
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "usuarioId", u.getId(),
                "nombre", u.getNombre(),
                "avatarUrl", u.getAvatarUrl(),
                // nombre estandarizado para el front:
                "accessToken", accessToken
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "ok", false,
                "error", e.getMessage()
            ));
        }
    }
}
