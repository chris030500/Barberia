// src/main/java/com/barber/backend/agenda/config/AgendaProperties.java
package com.barber.backend.agenda.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "agenda")
public class AgendaProperties {
  private String timezone = "America/Mexico_City";
  private int openHour = 9;
  private int closeHour = 19;
  private int slotSizeMin = 15;
  private int bufferBetweenMin = 5;
  private int minAdvanceMin = 0;
  private int maxAdvanceDays = 30;

  // getters & setters
  public String getTimezone() { return timezone; }
  public void setTimezone(String timezone) { this.timezone = timezone; }
  public int getOpenHour() { return openHour; }
  public void setOpenHour(int openHour) { this.openHour = openHour; }
  public int getCloseHour() { return closeHour; }
  public void setCloseHour(int closeHour) { this.closeHour = closeHour; }
  public int getSlotSizeMin() { return slotSizeMin; }
  public void setSlotSizeMin(int slotSizeMin) { this.slotSizeMin = slotSizeMin; }
  public int getBufferBetweenMin() { return bufferBetweenMin; }
  public void setBufferBetweenMin(int bufferBetweenMin) { this.bufferBetweenMin = bufferBetweenMin; }
  public int getMinAdvanceMin() { return minAdvanceMin; }
  public void setMinAdvanceMin(int minAdvanceMin) { this.minAdvanceMin = minAdvanceMin; }
  public int getMaxAdvanceDays() { return maxAdvanceDays; }
  public void setMaxAdvanceDays(int maxAdvanceDays) { this.maxAdvanceDays = maxAdvanceDays; }
}
