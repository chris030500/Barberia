package com.barber.backend.login.service;

import java.util.Collections;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleService {

  private final GoogleIdTokenVerifier verifier;

  public GoogleService(@Value("${app.google.client-id}") String clientId) {
    this.verifier = new GoogleIdTokenVerifier.Builder(
        new NetHttpTransport(), new GsonFactory())
        .setAudience(Collections.singletonList(clientId))
        .build();
  }

  /** Verifica y extrae campos estándar del token de Google */
  public Map<String, Object> verify(String idTokenString) {
    try {
      GoogleIdToken idToken = verifier.verify(idTokenString);
      if (idToken == null) throw new RuntimeException("Token de Google inválido");

      var p = idToken.getPayload();
      return Map.of(
          "sub", p.getSubject(),                // ID único de Google
          "email", p.getEmail(),
          "emailVerified", p.getEmailVerified(),
          "nombre", (String) p.get("given_name"),
          "apellido", (String) p.get("family_name"),
          "avatar", (String) p.get("picture")
      );
    } catch (Exception e) {
      throw new RuntimeException("Error verificando token de Google", e);
    }
  }
}

