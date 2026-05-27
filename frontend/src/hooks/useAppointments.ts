import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsService, type AppointmentFilters } from "@/services/appointments";

export function useAppointments(filters: AppointmentFilters = {}) {
  return useQuery({
    queryKey: ["appointments", filters],
    queryFn: () => appointmentsService.list(filters),
  });
}

export function useWeekAppointments(date?: string) {
  return useQuery({
    queryKey: ["appointments", "week", date],
    queryFn: () => appointmentsService.week(date),
  });
}

export function useTodayAppointments() {
  return useQuery({
    queryKey: ["appointments", "today"],
    queryFn: () => appointmentsService.today(),
    refetchInterval: 60_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: appointmentsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useAppointmentAction() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["appointments"] });
  return {
    checkin: useMutation({ mutationFn: appointmentsService.checkin, onSuccess: invalidate }),
    checkout: useMutation({ mutationFn: appointmentsService.checkout, onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: appointmentsService.cancel, onSuccess: invalidate }),
    noShow: useMutation({ mutationFn: appointmentsService.noShow, onSuccess: invalidate }),
  };
}
