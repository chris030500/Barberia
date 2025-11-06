import { http } from "@/api/http";
import type { DashboardResumen } from "./types";

export async function getDashboardResumen(): Promise<DashboardResumen> {
  const { data } = await http.get<DashboardResumen>("/api/analytics/resumen");
  return data;
}
