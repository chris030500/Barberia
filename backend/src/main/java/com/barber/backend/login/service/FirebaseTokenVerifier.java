package com.barber.backend.login.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;

@Service
public class FirebaseTokenVerifier {
  public FirebaseToken verify(String idToken) throws Exception {
    // Verifica firma/exp/audiencia con Firebase
    return FirebaseAuth.getInstance().verifyIdToken(idToken, true);
  }
}
