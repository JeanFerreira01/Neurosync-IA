import api from "@/lib/api";
import type {
  NeurotestScale, NeurotestSession, NeurotestStockSummary, PaginatedResponse,
} from "@/types";

export const neurotestsService = {
  listScales: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<NeurotestScale>>("/neurotests/scales/", { params: { page_size: "200", ...params } }).then((r) => r.data),

  createScale: (data: Partial<NeurotestScale>) =>
    api.post<NeurotestScale>("/neurotests/scales/", data).then((r) => r.data),

  updateScale: (id: string, data: Partial<NeurotestScale>) =>
    api.patch<NeurotestScale>(`/neurotests/scales/${id}/`, data).then((r) => r.data),

  deleteScale: (id: string) =>
    api.delete(`/neurotests/scales/${id}/`),

  stockSummary: () =>
    api.get<NeurotestStockSummary>("/neurotests/scales/stock-summary/").then((r) => r.data),

  listSessions: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<NeurotestSession>>("/neurotests/sessions/", { params }).then((r) => r.data),

  createSession: (data: Partial<NeurotestSession>) =>
    api.post<NeurotestSession>("/neurotests/sessions/", data).then((r) => r.data),

  updateSession: (id: string, data: Partial<NeurotestSession>) =>
    api.patch<NeurotestSession>(`/neurotests/sessions/${id}/`, data).then((r) => r.data),

  deleteSession: (id: string) =>
    api.delete(`/neurotests/sessions/${id}/`),
};
