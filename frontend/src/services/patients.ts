import api from "@/lib/api";
import type { Patient, PaginatedResponse } from "@/types";

export interface PatientFilters {
  search?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
}

export const patientsService = {
  list: (filters: PatientFilters = {}) =>
    api.get<PaginatedResponse<Patient>>("/patients/", { params: filters }).then((r) => r.data),

  get: (id: string) =>
    api.get<Patient>(`/patients/${id}/`).then((r) => r.data),

  create: (data: Partial<Patient>) =>
    api.post<Patient>("/patients/", data).then((r) => r.data),

  update: (id: string, data: Partial<Patient>) =>
    api.patch<Patient>(`/patients/${id}/`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/patients/${id}/deactivate/`).then((r) => r.data),

  getMedicalRecord: (id: string) =>
    api.get(`/patients/${id}/medical-record/`).then((r) => r.data),

  updateMedicalRecord: (id: string, data: object) =>
    api.patch(`/patients/${id}/medical-record/`, data).then((r) => r.data),

  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/patients/${id}/documents/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
};
