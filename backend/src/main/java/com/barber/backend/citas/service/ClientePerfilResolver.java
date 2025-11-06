package com.barber.backend.citas.service;

import com.barber.backend.citas.dto.CitaSaveRequest;
import com.barber.backend.login.exception.PerfilIncompletoException;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import com.barber.backend.login.security.AppUserPrincipal;
import java.util.LinkedHashSet;
import java.util.Objects;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
class ClientePerfilResolver {

    private final UsuarioRepository usuarioRepository;

    ClientePerfilResolver(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    ClienteData resolve(
            CitaSaveRequest request,
            AppUserPrincipal principal,
            String currentNombre,
            String currentTelefono) {

        Usuario usuario = fetchUsuario(principal);

        String overrideNombre = normalize(request.clienteNombre());
        String overrideTelefono = normalize(request.clienteTelE164());

        String nombre = firstNonBlank(
                overrideNombre,
                normalize(currentNombre),
                normalize(usuario.getNombre()),
                normalize(usuario.getUsername()),
                principal != null ? normalize(principal.getUsername()) : null);

        String telefono = firstNonBlank(
                overrideTelefono,
                normalize(currentTelefono),
                normalize(usuario.getTelefonoE164()));

        if (!StringUtils.hasText(nombre) || !StringUtils.hasText(telefono)) {
            LinkedHashSet<String> faltantes = new LinkedHashSet<>();
            if (!StringUtils.hasText(nombre)) {
                faltantes.add("nombre");
            }
            if (!StringUtils.hasText(telefono)) {
                faltantes.add("teléfono");
            }
            throw new PerfilIncompletoException(faltantes);
        }

        return new ClienteData(nombre.trim(), telefono.trim());
    }

    private Usuario fetchUsuario(AppUserPrincipal principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new IllegalStateException("Debes iniciar sesión para reservar");
        }

        return usuarioRepository
                .findById(principal.getUserId())
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado"));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if ("usuario".equalsIgnoreCase(trimmed)) {
            return null;
        }
        return trimmed;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    record ClienteData(String nombre, String telefono) {
        ClienteData {
            Objects.requireNonNull(nombre, "nombre");
            Objects.requireNonNull(telefono, "telefono");
        }
    }
}

