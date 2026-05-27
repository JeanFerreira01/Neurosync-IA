import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsService } from "@/services/reports";
import type { Report } from "@/types";

export function useReports(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["reports", params],
    queryFn: () => reportsService.list(params),
    select: (data) => data.results,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => reportsService.get(id),
    enabled: !!id,
  });
}

export function useReportVersions(id: string) {
  return useQuery({
    queryKey: ["report-versions", id],
    queryFn: () => reportsService.versions(id),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Report>) => reportsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      // Backend deducts inventory on create — refresh stock views
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-alerts"] });
      qc.invalidateQueries({ queryKey: ["neurotest-scales"] });
      qc.invalidateQueries({ queryKey: ["neurotest-stock-summary"] });
    },
  });
}

export function useUpdateReport(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Report>) => reportsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["report", id] });
      qc.invalidateQueries({ queryKey: ["report-versions", id] });
    },
  });
}

export function useSignReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signed_by_name }: { id: string; signed_by_name: string }) =>
      reportsService.sign(id, signed_by_name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useAnalyzeScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scores }: { id: string; scores: Record<string, Record<string, string | number>> }) =>
      reportsService.analyzeScores(id, scores),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["report", id] });
      qc.invalidateQueries({ queryKey: ["report-versions", id] });
    },
  });
}

export function useReportTemplates() {
  return useQuery({
    queryKey: ["report-templates"],
    queryFn: () => reportsService.templates.list(),
  });
}
