package com.barber.backend.login.service;

import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class UsuarioSocialService {

    private final UsuarioRepository repo;

    public UsuarioSocialService(UsuarioRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public Usuario getOrCreateFromGoogle(Map<String, Object> googleData) {
        // Aceptar ambas variantes de claves (snake_case y camelCase)
        String sub = str(googleData.get("sub"));
        String email = lower(str(or(googleData.get("email"), googleData.get("emailAddress"))));
        Boolean emailVer = bool(or(googleData.get("email_verified"), googleData.get("emailVerified")));

        String given = str(or(googleData.get("given_name"), googleData.get("givenName")));
        String family = str(or(googleData.get("family_name"), googleData.get("familyName")));
        String fullName = str(or(googleData.get("name"), googleData.get("displayName")));
        String picture = str(or(googleData.get("picture"), googleData.get("avatar")));

        // 1) Buscar por proveedor + proveedorId
        Optional<Usuario> byProv = repo.findByProveedorAndProveedorId(Usuario.Proveedor.GOOGLE, sub);
        if (byProv.isPresent()) {
            Usuario u = byProv.get();

            // Completar/actualizar datos visibles si faltan o cambiaron
            maybeFillNames(u, given, family, fullName);
            if (emailVer != null && emailVer && email != null && isBlank(u.getEmail())) {
                u.setEmail(email);
            }
            if (picture != null && (u.getAvatarUrl() == null || !picture.equals(u.getAvatarUrl()))) {
                u.setAvatarUrl(picture);
            }
            return repo.save(u);
        }

        // 2) Vincular por email si ya existe (evitar duplicados)
        if (email != null) {
            Optional<Usuario> byEmail = repo.findByEmail(email);
            if (byEmail.isPresent()) {
                Usuario u = byEmail.get();
                u.setProveedor(Usuario.Proveedor.GOOGLE);
                u.setProveedorId(sub);
                maybeFillNames(u, given, family, fullName);
                if (picture != null)
                    u.setAvatarUrl(picture);
                // No toques passwordHash (social = null)
                return repo.save(u);
            }
        }

        // 3) Crear nuevo usuario social
        Usuario u = new Usuario();
        u.setProveedor(Usuario.Proveedor.GOOGLE);
        u.setProveedorId(sub);
        maybeFillNames(u, given, family, fullName);
        if (emailVer != null && emailVer) {
            u.setEmail(email);
        }
        u.setAvatarUrl(picture);
        u.setTelefonoVerificado(false);
        u.setPasswordHash(null); // << social, sin password local

        // username opcional: si tu tabla lo exige único y no lo seteas en otro lado
        if (isBlank(u.getUsername())) {
            String base = !isBlank(email) ? email.split("@")[0] : ("google_" + sub);
            u.setUsername(base.toLowerCase().replaceAll("[^a-z0-9_\\.\\-]", ""));
        }

        return repo.save(u);
    }

    @Transactional
    public Usuario getOrCreateFromFacebook(Map<String, Object> fb) {
        String sub = (String) fb.get("sub");
        String email = (String) fb.get("email");
        String nombre = (String) fb.get("nombre");
        String apellido = (String) fb.get("apellido");
        String avatar = (String) fb.get("avatar");

        // 1) Buscar por proveedor + proveedorId
        var byProvider = repo.findByProveedorAndProveedorId(Usuario.Proveedor.FACEBOOK, sub);
        if (byProvider.isPresent()) {
            var u = byProvider.get();
            if (avatar != null && !avatar.equals(u.getAvatarUrl())) {
                u.setAvatarUrl(avatar);
            }
            if (email != null && u.getEmail() == null) {
                u.setEmail(email);
            }
            return repo.save(u);
        }

        // 2) Vincular por email si ya existe
        if (email != null) {
            var byEmail = repo.findByEmail(email);
            if (byEmail.isPresent()) {
                var u = byEmail.get();
                u.setProveedor(Usuario.Proveedor.FACEBOOK);
                u.setProveedorId(sub);
                if (avatar != null)
                    u.setAvatarUrl(avatar);
                return repo.save(u);
            }
        }

        // 3) Crear nuevo
        var u = new Usuario();
        u.setNombre(nombre);
        u.setApellido(apellido);
        u.setEmail(email);
        u.setProveedor(Usuario.Proveedor.FACEBOOK);
        u.setProveedorId(sub);
        u.setAvatarUrl(avatar);
        u.setPasswordHash("!oauth-facebook");
        u.setTelefonoVerificado(false);
        return repo.save(u);
    }

    /* ===== helpers ===== */

    private static Object or(Object a, Object b) {
        return a != null ? a : b;
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o).trim();
    }

    private static String lower(String s) {
        return s == null ? null : s.toLowerCase();
    }

    private static Boolean bool(Object o) {
        if (o == null)
            return null;
        if (o instanceof Boolean b)
            return b;
        return "true".equalsIgnoreCase(String.valueOf(o));
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static void maybeFillNames(Usuario u, String given, String family, String full) {
        if (isBlank(u.getNombre())) {
            if (!isBlank(given))
                u.setNombre(given);
            else if (!isBlank(full))
                u.setNombre(full);
            else
                u.setNombre("Usuario");
        }
        if (isBlank(u.getApellido()) && !isBlank(family)) {
            u.setApellido(family);
        }
    }
}
