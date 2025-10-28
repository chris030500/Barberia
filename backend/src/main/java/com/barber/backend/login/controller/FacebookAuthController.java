package com.barber.backend.login.controller;

import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.service.FacebookService;
import com.barber.backend.login.service.JwtService;
import com.barber.backend.login.service.UsuarioSocialService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

    @PostMapping("/facebook")
    public ResponseEntity<?> loginWithFacebook(@RequestBody Map<String, String> body,
                                               HttpServletRequest req,
                                               HttpServletResponse res) {
        try {
            // 1) Verificar el access token de Facebook (User token)
            String accessTokenFb = body.get("accessToken");
            var data = facebook.verify(accessTokenFb);

            // 2) Upsert del usuario
            Usuario u = social.getOrCreateFromFacebook(data);

            // 3) Emitir access token (corto, p.e. 15 min)
            String accessToken = jwt.issue(u.getId(), "user-" + u.getId(), List.of("USER"));

            // 4) Generar refresh token persistente y setear cookie httpOnly/secure
            sessionHelper.attachRefreshCookie(req, res, u.getId());

            // 5) Respuesta al frontend
            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "usuarioId", u.getId(),
                    "token", accessToken,
                    "nombre", u.getNombre(),
                    "avatarUrl", u.getAvatarUrl()
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