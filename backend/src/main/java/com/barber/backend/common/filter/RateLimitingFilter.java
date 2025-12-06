package com.barber.backend.common.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Bandwidth authLimit;
    private final Bandwidth citasLimit;

    public RateLimitingFilter(
            @Value("${app.rate-limit.auth.capacity:10}") long authCapacity,
            @Value("${app.rate-limit.auth.period-seconds:60}") long authPeriodSeconds,
            @Value("${app.rate-limit.citas.capacity:20}") long citasCapacity,
            @Value("${app.rate-limit.citas.period-seconds:60}") long citasPeriodSeconds
    ) {
        this.authLimit = Bandwidth.classic(authCapacity, Refill.greedy(authCapacity, Duration.ofSeconds(authPeriodSeconds)));
        this.citasLimit = Bandwidth.classic(citasCapacity, Refill.greedy(citasCapacity, Duration.ofSeconds(citasPeriodSeconds)));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Bandwidth limit = resolveLimit(request.getRequestURI());
        if (limit == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = buildKey(request);
        Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket4j.builder().addLimit(limit).build());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000L;
        response.setStatus(429);
        response.addHeader("Retry-After", String.valueOf(Math.max(1, retryAfterSeconds)));
        response.setContentType("application/json");
        response.getWriter().write("{\"ok\":false,\"error\":\"rate_limit\"}");
    }

    private String buildKey(HttpServletRequest request) {
        StringBuilder key = new StringBuilder(request.getRemoteAddr());
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getName() != null) {
            key.append(":").append(authentication.getName());
        }

        String bucketName = request.getRequestURI().startsWith("/auth") ? "auth" : "citas";
        key.append(":").append(bucketName);
        return key.toString();
    }

    private Bandwidth resolveLimit(String path) {
        if (path.startsWith("/auth")) {
            return authLimit;
        }
        if (path.startsWith("/api/citas")) {
            return citasLimit;
        }
        return null;
    }
}
