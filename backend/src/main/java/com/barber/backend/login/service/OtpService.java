package com.barber.backend.login.service;

import com.barber.backend.login.model.PhoneOtp;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.PhoneOtpRepository;
import com.barber.backend.login.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OtpService {

  private final PhoneOtpRepository otpRepo;
  private final UsuarioRepository userRepo;
  private final SmsSender sms;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

  // Configurables (si quieres pásalos a application.yml con @Value)
  private final int otpLen = 6;
  private final Duration otpTtl = Duration.ofMinutes(5);
  private final Duration resendGrace = Duration.ofSeconds(45); // evita spam de reenvíos

  public OtpService(PhoneOtpRepository otpRepo,
                    UsuarioRepository userRepo,
                    SmsSender sms) {
    this.otpRepo = otpRepo;
    this.userRepo = userRepo;
    this.sms = sms;
  }

  /* =======================
   *   LOGIN por teléfono
   * ======================= */
  @Transactional
  public void enviarLogin(String telE164) {
    emitirOtp(telE164, PhoneOtp.Purpose.LOGIN);
  }

  /**
   * Verifica OTP de LOGIN y devuelve el usuario autenticado.
   * (El controlador emite el access token y refresh cookie).
   */
  @Transactional
  public Map<String, Object> verificarLogin(String telE164, String code) {
    String tel = normalizar(telE164);
    PhoneOtp otp = otpRepo
        .findTopByTelefonoE164AndPurposeAndConsumidoFalseOrderByIdDesc(tel, PhoneOtp.Purpose.LOGIN)
        .orElseThrow(() -> new IllegalArgumentException("Código inválido"));

    validarOtp(otp, code);

    // Crea el usuario si no existe
    Usuario u = userRepo.findByTelefonoE164(tel).orElseGet(() -> {
      Usuario nuevo = new Usuario();
      nuevo.setTelefonoE164(tel);
      nuevo.setTelefonoVerificado(true);
      nuevo.setProveedor(Usuario.Proveedor.LOCAL);
      nuevo.setNombre("Usuario");
      nuevo.setApellido("OTP");
      nuevo.setPasswordHash("!otp-login"); // marcador
      return userRepo.save(nuevo);
    });

    return Map.of(
        "ok", true,
        "usuarioId", u.getId(),
        "telefono", tel
    );
  }

  /* ===========================
   *   VINCULAR a usuario logueado
   * =========================== */
  @Transactional
  public void enviarLink(String telE164) {
    emitirOtp(telE164, PhoneOtp.Purpose.LINK);
  }

  @Transactional
  public Map<String, Object> verificarLink(String telE164, String code) {
    String tel = normalizar(telE164);
    PhoneOtp otp = otpRepo
        .findTopByTelefonoE164AndPurposeAndConsumidoFalseOrderByIdDesc(tel, PhoneOtp.Purpose.LINK)
        .orElseThrow(() -> new IllegalArgumentException("Código inválido"));

    validarOtp(otp, code);

    // Debe haber usuario autenticado (JwtAuthFilter pone sub = "user-<id>")
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || auth.getName() == null) {
      throw new IllegalStateException("Debes iniciar sesión para vincular teléfono");
    }
    Long uid = extraerUidDesdeSub(auth.getName());

    // Evitar que se vincule un número ya usado por otro usuario
    userRepo.findByTelefonoE164(tel).ifPresent(existente -> {
      if (!existente.getId().equals(uid)) {
        throw new IllegalStateException("El teléfono ya está en uso por otra cuenta");
      }
    });

    Usuario u = userRepo.findById(uid)
        .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));
    u.setTelefonoE164(tel);
    u.setTelefonoVerificado(true);
    userRepo.save(u);

    return Map.of("ok", true, "usuarioId", u.getId(), "telefono", tel);
  }

  /* =======================
   *   Helpers internos
   * ======================= */
  private void emitirOtp(String telE164, PhoneOtp.Purpose purpose) {
    String tel = normalizar(telE164);

    // Reutiliza el último OTP si aún es válido y fue generado hace muy poco (evita spam)
    var existing = otpRepo.findTopByTelefonoE164AndPurposeAndConsumidoFalseOrderByIdDesc(tel, purpose)
        .filter(o -> o.getVenceEn().isAfter(LocalDateTime.now())
                  && Duration.between(o.getCreadoEn(), LocalDateTime.now()).compareTo(resendGrace) < 0);

    String code;
    PhoneOtp otp;

    if (existing.isPresent()) {
      otp = existing.get();
      // No cambiamos el hash; re-enviamos el mismo código
      code = "(código vigente)"; // por seguridad no lo conocemos en claro
      // Como no guardamos el código plano, generamos uno nuevo para reenvío
      // → Mejor: no mostrar código en logs y simplemente reusar el existente.
    } else {
      code = generarCodigo(otpLen);
      otp = new PhoneOtp();
      otp.setTelefonoE164(tel);
      otp.setCodeHash(encoder.encode(code));
      otp.setVenceEn(LocalDateTime.now().plus(otpTtl));
      otp.setPurpose(purpose);
      otpRepo.save(otp);
    }

    String msg;
    if (purpose == PhoneOtp.Purpose.LOGIN) {
      // Si reutilizamos, no conocemos el código en claro → vuelve a emitir
      if (existing.isPresent()) {
        // Para dev: puedes cambiar a un flujo que guarde el código de forma segura si necesitas reenvío idéntico
        msg = "Tu código de acceso sigue vigente. Si lo perdiste, espera " + resendGrace.toSeconds() + "s y solicita uno nuevo.";
      } else {
        msg = "Tu código de acceso: " + code + " (expira en " + otpTtl.toMinutes() + " min)";
      }
    } else {
      if (existing.isPresent()) {
        msg = "Tu código para vinculación sigue vigente. Si lo perdiste, espera " + resendGrace.toSeconds() + "s y solicita uno nuevo.";
      } else {
        msg = "Código para vincular tu teléfono: " + code + " (expira en " + otpTtl.toMinutes() + " min)";
      }
    }

    sms.send(tel, msg);
  }

  private void validarOtp(PhoneOtp otp, String code) {
    if (otp.getVenceEn().isBefore(LocalDateTime.now())) {
      marcarConsumido(otp);
      throw new IllegalArgumentException("Código expirado");
    }
    if (otp.getIntentos() >= otp.getMaxIntentos()) {
      marcarConsumido(otp);
      throw new IllegalArgumentException("Demasiados intentos");
    }
    if (!encoder.matches(code, otp.getCodeHash())) {
      otp.setIntentos(otp.getIntentos() + 1);
      otpRepo.save(otp);
      throw new IllegalArgumentException("Código inválido");
    }
    marcarConsumido(otp);
  }

  private void marcarConsumido(PhoneOtp otp) {
    otp.setConsumido(true);
    otpRepo.save(otp);
  }

  private String normalizar(String raw) {
    // Simple: quita espacios y guiones. (Luego puedes usar libphonenumber para E.164 estricto)
    return raw.replaceAll("[\\s-]", "");
  }

  private Long extraerUidDesdeSub(String sub) {
    if (sub != null && sub.startsWith("user-")) {
      try { return Long.parseLong(sub.substring(5)); } catch (NumberFormatException ignored) {}
    }
    throw new IllegalStateException("Sub inválido en el token");
  }

  private String generarCodigo(int len) {
    int bound = (int) Math.pow(10, len);
    String fmt = "%0" + len + "d";
    return String.format(fmt, ThreadLocalRandom.current().nextInt(0, bound));
  }
}