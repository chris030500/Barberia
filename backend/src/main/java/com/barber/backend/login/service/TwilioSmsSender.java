package com.barber.backend.login.service;

import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!dev-dummy") // Usa este sender salvo que actives el perfil “dev-dummy”
public class TwilioSmsSender implements SmsSender, InitializingBean {

  private static final Logger log = LoggerFactory.getLogger(TwilioSmsSender.class);

  @Value("${twilio.account-sid}")
  private String accountSid;

  @Value("${twilio.auth-token}")
  private String authToken;

  @Value("${twilio.from}")
  private String from;

  @Value("${twilio.whatsapp-from:}")
  private String whatsappFrom;

  @Override
  public void afterPropertiesSet() {
    Twilio.init(accountSid, authToken);
    log.info("✅ Twilio inicializado correctamente. From={}, WhatsAppFrom={}", mask(from), mask(whatsappFrom));
  }

  @Override
  public void send(String toE164, String text) {
    String to = toE164.trim();
    boolean isWhatsApp = to.startsWith("whatsapp:");

    String fromNumber = isWhatsApp
        ? (whatsappFrom != null && !whatsappFrom.isBlank() ? whatsappFrom : "whatsapp:" + from)
        : from;

    try {
      Message msg = Message.creator(
          new PhoneNumber(to),
          new PhoneNumber(fromNumber),
          text
      ).create();

      log.info("📨 SMS enviado a {} (SID={})", mask(to), msg.getSid());

    } catch (ApiException e) {
      log.error("❌ Error Twilio (status={}, code={}): {}", e.getStatusCode(), e.getCode(), e.getMessage());
      throw new RuntimeException("No se pudo enviar el SMS/WhatsApp");
    } catch (Exception e) {
      log.error("❌ Error inesperado enviando SMS: {}", e.getMessage(), e);
      throw new RuntimeException("No se pudo enviar el SMS/WhatsApp");
    }
  }

  private String mask(String tel) {
    if (tel == null || tel.length() < 6) return "****";
    return tel.substring(0, 3) + "****" + tel.substring(tel.length() - 2);
  }
}