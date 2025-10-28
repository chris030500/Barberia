package com.barber.backend.login.service;

public interface SmsSender {
  void send(String toE164, String text);
}

