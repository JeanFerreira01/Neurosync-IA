import api from "@/lib/api";
import type { Appointment, PaginatedResponse } from "@/types";

export interface AppointmentFilters {
  status?: string;
  professional?: string;
  patient?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export const appointmentsService = {
  list: (filters: AppointmentFilters = {}) =>
    api.get<PaginatedResponse<Appointment>>("/appointments/", { params: filters }).then((r) => r.data),

  get: (id: string) =>
    api.get<Appointment>(`/appointments/${id}/`).then((r) => r.data),

  create: (data: Partial<Appointment>) =>
    api.post<Appointment>("/appointments/", data).then((r) => r.data),

  update: (id: string, data: Partial<Appointment>) =>
    api.patch<Appointment>(`/appointments/${id}/`, data).then((r) => r.data),

  week: (date?: string) =>
    api.get("/appointments/week/", { params: date ? { date } : {} }).then((r) => r.data),

  today: () =>
    api.get<Appointment[]>("/appointments/today/").then((r) => r.data),

  checkin: (id: string) =>
    api.patch<Appointment>(`/appointments/${id}/checkin/`).then((r) => r.data),

  checkout: (id: string) =>
    api.patch<Appointment>(`/appointments/${id}/checkout/`).then((r) => r.data),

  cancel: (id: string) =>
    api.patch<Appointment>(`/appointments/${id}/cancel/`).then((r) => r.data),

  noShow: (id: string) =>
    api.patch<Appointment>(`/appointments/${id}/no-show/`).then((r) => r.data),
};
