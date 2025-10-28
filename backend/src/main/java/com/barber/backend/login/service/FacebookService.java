package com.barber.backend.login.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class FacebookService {

    private final String appId;
    private final String appSecret;
    private final RestClient http;
    private final ObjectMapper json = new ObjectMapper();

    public FacebookService(
            @Value("${app.facebook.app-id}") String appId,
            @Value("${app.facebook.app-secret}") String appSecret,
            RestClient.Builder httpBuilder
    ) {
        this.appId = appId;
        this.appSecret = appSecret;
        this.http = httpBuilder
                .baseUrl("https://graph.facebook.com")
                .defaultHeader(HttpHeaders.ACCEPT, "*/*")
                .build();
    }

    /**
     * Verifica un user access token de Facebook y devuelve un mapa normalizado:
     *  sub, nombre, apellido (vacío), email (opcional), emailVerified (boolean), avatar (opcional)
     */
    public Map<String, Object> verify(String userAccessToken) {
        try {
            // 1) Validar token con /debug_token usando app access token (appId|appSecret)
            String debugBody = http.get()
                    .uri(uri -> uri
                            .path("/v20.0/debug_token")
                            .queryParam("input_token", userAccessToken)
                            .queryParam("access_token", appId + "|" + appSecret)
                            .queryParam("format", "json")
                            .build())
                    .retrieve()
                    .body(String.class);

            Map<String, Object> debug = parseJson(debugBody);
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) debug.get("data");
            if (data == null) {
                throw new RuntimeException("debug_token sin 'data': " + debugBody);
            }

            Boolean isValid = asBool(data.get("is_valid"));
            String appIdResp = asString(data.get("app_id"));

            if (!Boolean.TRUE.equals(isValid)) {
                throw new RuntimeException("accessToken inválido (is_valid=false). Body: " + debugBody);
            }
            if (appIdResp == null || !appIdResp.equals(this.appId)) {
                throw new RuntimeException("Token no emitido para esta appId. Esperado=" + this.appId + " recibido=" + appIdResp);
            }

            // 2) Obtener perfil con /me
            String meBody = http.get()
                    .uri(uri -> uri
                            .path("/v20.0/me")
                            .queryParam("fields", "id,name,email,picture.type(large)")
                            .queryParam("format", "json")
                            .queryParam("access_token", userAccessToken)
                            .build())
                    .retrieve()
                    .body(String.class);

            Map<String, Object> me = parseJson(meBody);

            String id = asString(me.get("id"));
            String name = asString(me.get("name"));
            String email = asString(me.get("email"));

            // picture.data.url
            String avatar = null;
            Object pictureObj = me.get("picture");
            if (pictureObj instanceof Map<?, ?> picMap) {
                Object dataObj = ((Map<?, ?>) picMap).get("data");
                if (dataObj instanceof Map<?, ?> dataMap) {
                    avatar = asString(((Map<?, ?>) dataMap).get("url"));
                }
            }

            // 3) Normalizar salida (sin Map.of para tolerar nulls)
            Map<String, Object> out = new HashMap<>();
            out.put("sub", Objects.requireNonNull(id, "id nulo en respuesta de Facebook"));
            out.put("nombre", name != null ? name : "");
            out.put("apellido", ""); // si luego quieres separar name en nombre/apellido, aquí lo haríamos

            if (email != null && !email.isBlank()) {
                out.put("email", email);
                out.put("emailVerified", true);
            } else {
                out.put("emailVerified", false);
            }

            if (avatar != null && !avatar.isBlank()) {
                out.put("avatar", avatar);
            }

            return out;

        } catch (Exception e) {
            // Propaga el mensaje y mantiene la causa original para facilitar debug
            throw new RuntimeException("Error verificando token de Facebook: " + e.getMessage(), e);
        }
    }

    // ----------------- helpers -----------------

    private Map<String, Object> parseJson(String body) {
        try {
            return json.readValue(body, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("JSON inválido de Facebook: " + body, e);
        }
    }

    private static String asString(Object o) {
        return (o == null) ? null : String.valueOf(o);
    }

    private static Boolean asBool(Object o) {
        if (o instanceof Boolean b) return b;
        if (o == null) return null;
        return Boolean.valueOf(String.valueOf(o));
    }
}
