package com.barber.backend.login.controller;

import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.service.GoogleService;
import com.barber.backend.login.service.UsuarioSocialService;
import com.barber.backend.login.service.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador responsable del inicio de sesión mediante Google OAuth.
 * 
 * Flujo:
 * 1️⃣ Recibe un idToken de Google desde el frontend.
 * 2️⃣ Verifica la firma y la validez del token con GoogleService.
 * 3️⃣ Obtiene o crea el usuario en base de datos con UsuarioSocialService.
 * 4️⃣ Emite un JWT de acceso (access token).
 * 5️⃣ Genera un refresh token (persistente) y lo guarda en cookie httpOnly.
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

    /**
     * Endpoint para iniciar sesión con Google.
     * 
     * @param body JSON con el idToken de Google.
     * @param req  Request (para obtener IP y User-Agent).
     * @param res  Response (para agregar cookie del refresh token).
     * @return     Access token + información básica del usuario.
     */
    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> body,
                                             HttpServletRequest req,
                                             HttpServletResponse res) {
        try {
            // 1️⃣ Validar el idToken con Google
            String idToken = body.get("idToken");
            var data = googleService.verify(idToken); // Verifica firma y audiencia
            
            // 2️⃣ Crear o recuperar el usuario
            Usuario u = usuarioSocial.getOrCreateFromGoogle(data);
            
            // 3️⃣ Emitir JWT de acceso (válido ~15 minutos)
            String accessToken = jwt.issue(u.getId(), "user-" + u.getId(), List.of("USER"));

            // 4️⃣ Emitir refresh token y guardarlo en cookie segura (httpOnly)
            sessionHelper.attachRefreshCookie(req, res, u.getId());

            // 5️⃣ Responder con datos básicos + access token
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