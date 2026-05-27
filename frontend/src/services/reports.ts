import api from "@/lib/api";
import type { Report, ReportTemplate, ReportVersion, PaginatedResponse } from "@/types";

export const reportsService = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Report>>("/reports/", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Report>(`/reports/${id}/`).then((r) => r.data),

  create: (data: Partial<Report>) =>
    api.post<Report>("/reports/", data).then((r) => r.data),

  update: (id: string, data: Partial<Report>) =>
    api.patch<Report>(`/reports/${id}/`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/reports/${id}/`),

  sign: (id: string, signed_by_name: string) =>
    api.post<Report>(`/reports/${id}/sign/`, { signed_by_name }).then((r) => r.data),

  downloadPdf: async (id: string, title: string) => {
    const res = await api.post(`/reports/${id}/pdf/`, {}, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  aiAssist: (id: string, payload: { section_title: string; current_content: string; instruction?: string }) =>
    api.post<{ suggestion: string }>(`/reports/${id}/ai-assist/`, payload).then((r) => r.data),

  analyzeScores: (id: string, test_scores: Record<string, Record<string, string | number>>) =>
    api.post<Report>(`/reports/${id}/analyze-scores/`, { test_scores }).then((r) => r.data),

  uploadAssessment: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<Report>(`/reports/${id}/upload-assessment/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  versions: (id: string) =>
    api.get<ReportVersion[]>(`/reports/${id}/versions/`).then((r) => r.data),

  templates: {
    list: () => api.get<PaginatedResponse<ReportTemplate>>("/reports/templates/").then((r) => r.data.results),
    create: (data: Partial<ReportTemplate>) =>
      api.post<ReportTemplate>("/reports/templates/", data).then((r) => r.data),
  },
};
