import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financialService } from "@/services/financial";
import type { Transaction } from "@/types";

export function useTransactions(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => financialService.list(params),
    select: (data) => data.results,
  });
}

export function useSummary(month?: string) {
  return useQuery({
    queryKey: ["financial-summary", month],
    queryFn: () => financialService.summary(month),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Transaction>) => financialService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["financial-summary"] });
    },
  });
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Transaction>) => financialService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["financial-summary"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["financial-summary"] });
    },
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialService.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["financial-summary"] });
    },
  });
}

export function usePatientMargin(patientId?: string) {
  return useQuery({
    queryKey: ["patient-margin", patientId],
    queryFn: () => financialService.patientMargin(patientId),
  });
}
