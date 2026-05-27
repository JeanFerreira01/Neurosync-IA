import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neurotestsService } from "@/services/neurotests";
import type { NeurotestScale, NeurotestSession } from "@/types";

export function useScales(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["neurotest-scales", params],
    queryFn: () => neurotestsService.listScales(params),
    select: (data) => data.results,
  });
}

export function useStockSummary() {
  return useQuery({
    queryKey: ["neurotest-stock-summary"],
    queryFn: () => neurotestsService.stockSummary(),
  });
}

export function useCreateScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NeurotestScale>) => neurotestsService.createScale(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["neurotest-scales"] });
      qc.invalidateQueries({ queryKey: ["neurotest-stock-summary"] });
    },
  });
}

export function useUpdateScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NeurotestScale> }) =>
      neurotestsService.updateScale(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["neurotest-scales"] });
      qc.invalidateQueries({ queryKey: ["neurotest-stock-summary"] });
    },
  });
}

export function useDeleteScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => neurotestsService.deleteScale(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["neurotest-scales"] });
      qc.invalidateQueries({ queryKey: ["neurotest-stock-summary"] });
    },
  });
}

export function useSessions(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["neurotest-sessions", params],
    queryFn: () => neurotestsService.listSessions(params),
    select: (data) => data.results,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NeurotestSession>) => neurotestsService.createSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["neurotest-sessions"] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NeurotestSession> }) =>
      neurotestsService.updateSession(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["neurotest-sessions"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => neurotestsService.deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["neurotest-sessions"] }),
  });
}
