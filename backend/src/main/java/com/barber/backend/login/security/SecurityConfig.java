package com.barber.backend.login.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import com.barber.backend.login.service.JwtService;

import java.util.List;

@Configuration
public class SecurityConfig {

  private final JwtService jwt;

  public SecurityConfig(JwtService jwt) {
    this.jwt = jwt;
  }

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable());
    http.cors(cors -> {
    }); // usa el bean CorsFilter

    http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    http.exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> res.sendError(401)));

    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/", "/auth/**", "/actuator/**").permitAll()
        .anyRequest().authenticated());

    http.addFilterBefore(new JwtAuthFilter(jwt), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  AuthenticationEntryPoint unauthorizedEntryPoint() {
    return (req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
  }

  @Bean
  CorsFilter corsFilter() {
    var cfg = new CorsConfiguration();
    cfg.setAllowCredentials(true);
    cfg.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000")); // ajusta a tu frontend
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return new CorsFilter(source);
  }
}
