import { apiClient } from "./api/client";
import type { DashboardResumen } from "@/types/dashboard";
import type { ApiEnvelope } from "@/types/finanzas";

export const dashboardService = {
  getResumen: async (): Promise<DashboardResumen> => {
    const res = await apiClient.get<ApiEnvelope<DashboardResumen>>("/dashboard/resumen");
    return res.data;
  },
};
