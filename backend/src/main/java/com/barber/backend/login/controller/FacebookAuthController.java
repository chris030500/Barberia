package com.barber.backend.login.controller;

import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.service.FacebookService;
import com.barber.backend.login.service.JwtService;
import com.barber.backend.login.service.UsuarioSocialService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class FacebookAuthController {

    private final FacebookService facebook;
    private final UsuarioSocialService social;
    private final JwtService jwt;
    private final SessionController sessionHelper;

    public FacebookAuthController(FacebookService facebook,
                                  UsuarioSocialService social,
                                  JwtService jwt,
                                  SessionController sessionHelper) {
        this.facebook = facebook;
        this.social = social;
        this.jwt = jwt;
        this.sessionHelper = sessionHelper;
    }

    @PostMapping(
        path = "/facebook",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> loginWithFacebook(@RequestBody Map<String, String> body,
                                               HttpServletRequest req,
                                               HttpServletResponse res) {
        try {
            // 1) Validar entrada
            String accessTokenFb = body.get("accessToken");
            if (accessTokenFb == null || accessTokenFb.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "error", "accessToken de Facebook requerido"
                ));
            }

            // 2) Verificar el access token de Facebook (firma/validez)
            var fbData = facebook.verify(accessTokenFb);

            // 3) Upsert del usuario
            Usuario u = social.getOrCreateFromFacebook(fbData);

            // 4) Emitir access token (corto, p.ej. 15 min)
            String accessToken = jwt.issue(u.getId(), "user-" + u.getId(), List.of("USER"));

            // 5) Generar refresh token y setear cookie HttpOnly (path=/auth)
            sessionHelper.attachRefreshCookie(req, res, u.getId());

            // 6) Respuesta al frontend (nombre estandarizado)
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "usuarioId", u.getId(),
                "nombre", u.getNombre(),
                "avatarUrl", u.getAvatarUrl(),
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
