package com.barber.backend.login.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthSessionController {

  @PostMapping("/logout")
  public ResponseEntity<?> logout() {
    ResponseCookie expired = ResponseCookie.from("access", "")
        .httpOnly(true).secure(true).sameSite("Lax").path("/").maxAge(0)
        .build();
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, expired.toString())
        .body(java.util.Map.of("ok", true));
  }
}