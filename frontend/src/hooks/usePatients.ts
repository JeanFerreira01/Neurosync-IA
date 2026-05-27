import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsService, type PatientFilters } from "@/services/patients";

export function usePatients(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: ["patients", filters],
    queryFn: () => patientsService.list(filters),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: () => patientsService.get(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patientsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => patientsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useDeactivatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patientsService.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}
