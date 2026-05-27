import api from "@/lib/api";
import type { Transaction, FinancialSummary, PatientMargin, PaginatedResponse } from "@/types";

export const financialService = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Transaction>>("/financial/transactions/", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Transaction>(`/financial/transactions/${id}/`).then((r) => r.data),

  create: (data: Partial<Transaction>) =>
    api.post<Transaction>("/financial/transactions/", data).then((r) => r.data),

  update: (id: string, data: Partial<Transaction>) =>
    api.patch<Transaction>(`/financial/transactions/${id}/`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/financial/transactions/${id}/`),

  markPaid: (id: string) =>
    api.patch<Transaction>(`/financial/transactions/${id}/mark-paid/`).then((r) => r.data),

  summary: (month?: string) =>
    api.get<FinancialSummary>("/financial/transactions/summary/", { params: month ? { month } : undefined }).then((r) => r.data),

  patientMargin: (patientId?: string) =>
    api.get<PatientMargin[]>("/financial/transactions/patient-margin/", { params: patientId ? { patient: patientId } : undefined }).then((r) => r.data),
};
