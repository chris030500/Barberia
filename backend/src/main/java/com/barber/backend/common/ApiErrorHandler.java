package com.barber.backend.common;

import com.barber.backend.login.exception.PerfilIncompletoException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrorHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("error", "validation_error");
    body.put("fields", ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .collect(HashMap::new, (m,e)-> m.put(e.getField(), e.getDefaultMessage()), HashMap::putAll));
    return ResponseEntity.badRequest().body(body);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<?> handleIllegalArg(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(Map.of("error", "invalid_request", "message", ex.getMessage()));
  }

  @ExceptionHandler(PerfilIncompletoException.class)
  public ResponseEntity<?> handlePerfilIncompleto(PerfilIncompletoException ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("error", "perfil_incompleto");
    body.put("message", ex.getMessage());
    Set<String> faltantes = ex.getCamposFaltantes();
    if (faltantes != null && !faltantes.isEmpty()) {
      body.put("camposFaltantes", faltantes);
    }
    return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).body(body);
  }
}
