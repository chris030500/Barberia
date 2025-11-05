// Convierte ISO → valor para <input type="datetime-local"> en tu zona local
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Convierte valor de <input type="datetime-local"> → ISO (Instant en UTC)
export function localInputToIso(local: string): string {
  // local es "YYYY-MM-DDTHH:mm" en zona del navegador
  const d = new Date(local);
  return d.toISOString();
}