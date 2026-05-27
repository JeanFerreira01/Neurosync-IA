export type UserRole =
  | "admin_master"
  | "clinic_admin"
  | "neuropsychologist"
  | "receptionist"
  | "patient";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  avatar: string | null;
  clinic: string | null;
}

export interface Clinic {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  plan: string;
}

export interface Patient {
  id: string;
  full_name: string;
  cpf: string;
  date_of_birth: string | null;
  gender: "M" | "F" | "O" | "";
  email: string;
  phone: string;
  health_insurance: string;
  is_active: boolean;
  created_at: string;
}

export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "in_progress"
  | "finished"
  | "canceled"
  | "no_show";

export interface Appointment {
  id: string;
  patient: string;
  patient_name: string;
  professional: string;
  professional_name: string;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_minutes: number;
  notes: string;
  checkin_at: string | null;
  checkout_at: string | null;
  is_telemedicine: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ReportStatus = "draft" | "review" | "signed";

export interface ReportSection {
  title: string;
  content: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: { title: string; placeholder: string }[];
  is_active: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  patient: string;
  patient_name: string;
  appointment: string | null;
  professional: string;
  professional_name: string;
  template: string | null;
  template_name: string | null;
  title: string;
  sections: ReportSection[];
  selected_tests: string[];
  test_scores: Record<string, Record<string, string | number>>;
  assessment_file: string | null;
  status: ReportStatus;
  pdf_file: string | null;
  signed_at: string | null;
  signed_by_name: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ReportVersion {
  id: string;
  version_number: number;
  sections_snapshot: ReportSection[];
  saved_by_name: string;
  created_at: string;
}

export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "paid" | "overdue" | "canceled";

export interface Transaction {
  id: string;
  clinic: string;
  appointment: string | null;
  patient: string | null;
  patient_name: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  description: string;
  due_date: string;
  paid_at: string | null;
  payment_method: string;
  insurance: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface Product {
  id: string;
  name: string;
  test_name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit_price: string;
  supplier: string;
  expiry_date: string | null;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export type NeurotestCategory =
  | "intelligence" | "memory" | "attention" | "development"
  | "autism" | "personality" | "neuropsych" | "other";

export type StockStatus = "ok" | "low" | "zero" | "untracked";

export interface NeurotestStockInfo {
  quantity: number | null;
  min_quantity: number;
  status: StockStatus;
  product_count: number;
  product_id: string | null;
}

export interface NeurotestScale {
  id: string;
  clinic: string | null;
  name: string;
  abbreviation: string;
  category: NeurotestCategory | "";
  category_display: string;
  description: string;
  age_range: string;
  application_time: string;
  is_active: boolean;
  scoring_guide: string;
  stock_info: NeurotestStockInfo;
  created_at: string;
  updated_at: string;
}

export type SessionStatus = "pending" | "in_progress" | "completed";

export interface NeurotestSession {
  id: string;
  patient: string;
  patient_name: string;
  professional: string;
  professional_name: string;
  scale: string;
  scale_name: string;
  scale_abbreviation: string;
  appointment: string | null;
  status: SessionStatus;
  status_display: string;
  raw_score: number | null;
  normalized_score: number | null;
  observations: string;
  answers: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NeurotestStockSummary {
  total: number;
  ok: number;
  low: number;
  zero: number;
  untracked: number;
}

export interface PatientMargin {
  patient_id: string;
  patient_name: string;
  income: number;
  expense: number;
  margin: number;
  margin_pct: number;
}

export interface ProductAlert extends Product {
  alert_type: "low_stock" | "expiring";
}

export type StockMovementType = "entry" | "exit" | "adjustment" | "loss" | "internal";

export interface StockMovement {
  id: string;
  product: string;
  product_name: string;
  type: StockMovementType;
  quantity: number;
  notes: string;
  performed_by_name: string;
  created_at: string;
}
