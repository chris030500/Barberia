package com.barber.backend.login.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;

@Configuration
public class FirebaseConfig {

  @Bean
  public FirebaseApp firebaseApp() throws Exception {
    // Usa GOOGLE_APPLICATION_CREDENTIALS o ruta absoluta del JSON
    String credPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
    FirebaseOptions options = FirebaseOptions.builder()
        .setCredentials(GoogleCredentials.fromStream(new FileInputStream(credPath)))
        .build();
    return FirebaseApp.initializeApp(options);
  }
}
