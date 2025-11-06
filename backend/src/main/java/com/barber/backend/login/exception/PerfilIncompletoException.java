package com.barber.backend.login.exception;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Se lanza cuando un usuario autenticado intenta ejecutar una acción que
 * requiere contar con información básica de perfil (nombre/teléfono) y esta
 * aún no se ha completado.
 */
@ResponseStatus(HttpStatus.PRECONDITION_FAILED)
public class PerfilIncompletoException extends RuntimeException {

    private final Set<String> camposFaltantes;

    public PerfilIncompletoException(Set<String> camposFaltantes) {
        super(buildMessage(camposFaltantes));
        this.camposFaltantes = camposFaltantes == null
                ? Set.of()
                : Set.copyOf(new LinkedHashSet<>(camposFaltantes));
    }

    public Set<String> getCamposFaltantes() {
        return camposFaltantes;
    }

    private static String buildMessage(Set<String> campos) {
        if (campos == null || campos.isEmpty()) {
            return "Debes completar tu perfil antes de continuar";
        }
        String lista = campos.stream()
                .map(c -> c.replace('_', ' '))
                .collect(Collectors.joining(", "));
        return "Debes completar tu perfil: faltan " + lista;
    }
}