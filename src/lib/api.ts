import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function handleUnauthorizedSession() {
  useAuthStore.getState().logout();
  useToastStore.getState().addToast({
    title: "Session expired",
    description: "Please sign in again to continue.",
    variant: "error",
  });
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export type User = {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string;
  role: "super_admin" | "org_admin" | "org_user";
  is_active: boolean;
};
export type Organization = {
  id: string;
  name: string;
  slug: string;
  country: string;
  subscription_status: "trial" | "active" | "past_due" | "canceled";
  created_at: string;
};
export type Team = {
  organization: Organization;
  members: User[];
};
export type AuditLog = {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};
export type AuditLogList = {
  items: AuditLog[];
  total: number;
};
export type PlatformOrganization = Organization & {
  user_count: number;
  product_count: number;
};
export type PlatformAnalytics = {
  organization_count: number;
  active_subscription_count: number;
  user_count: number;
  product_count: number;
  audit_log_count: number;
};
export type PlatformOrganizationCreated = {
  organization: PlatformOrganization;
  admin: User;
  temporary_password: string;
  created_at: string;
};

export type Product = {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  description: string;
  manufacturer: string;
  country: string;
  production_method: string;
  image_url: string | null;
  material_composition: Record<string, unknown>;
  certifications: Array<Record<string, unknown>>;
  environmental_records: EnvironmentalRecord[];
  created_at: string;
  updated_at: string;
};

export type EnvironmentalRecord = {
  id: string;
  product_id: string;
  co2_kg: number;
  water_liters: number;
  energy_kwh: number;
  transportation_kg_co2: number;
  recyclability_score: number;
  sustainability_score: number;
  notes: string;
  recorded_at: string;
};

export type ProductList = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  categories: string[];
};
export type ProductQuery = {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};
export type ImportResult = {
  created: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};
export type CertificateExtraction = {
  id: string;
  organization_id: string;
  product_id: string | null;
  file_name: string;
  certification_name: string | null;
  expiry_date: string | null;
  emission_value: number | null;
  compliance_information: string | null;
  extracted_json: Record<string, unknown>;
  status: "needs_review" | "approved" | "rejected";
  created_at: string;
};
export type CertificateExtractionList = {
  items: CertificateExtraction[];
  total: number;
};
export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  user: User;
};
export type AdvisorResult = {
  product_id: string;
  provider: string;
  recommendations: Array<{
    title: string;
    category: string;
    impact: string;
    rationale: string;
    next_step: string;
  }>;
};
export type ReportResult = {
  product_id: string;
  summary: string;
  markdown: string;
};
export type AIJob = {
  id: string;
  organization_id: string;
  product_id: string;
  job_type: "advisor" | "report";
  status: "pending" | "running" | "succeeded" | "failed";
  result_json: Record<string, unknown> | null;
  error_message: string | null;
};

async function refreshSession() {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return false;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return false;
  const session = (await response.json()) as AuthTokens;
  useAuthStore.getState().setSession(session);
  return true;
}

async function request<T>(path: string, init: RequestInit = {}, retryOnUnauthorized = true): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    const message = error.detail ?? "Request failed";
    if (response.status === 401 && token && !path.startsWith("/auth/login")) {
      if (retryOnUnauthorized && !path.startsWith("/auth/refresh") && await refreshSession()) {
        return request<T>(path, init, false);
      }
      handleUnauthorizedSession();
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: { email: string; password: string; organization_slug?: string }) =>
    request<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: Record<string, unknown>) =>
    request<AuthTokens>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload: { email: string; organization_slug?: string }) =>
    request<{ message: string; reset_url?: string | null }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload: { token: string; password: string }) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  acceptInvite: (payload: { token: string; password: string }) =>
    request<AuthTokens>("/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<User>("/auth/me"),
  currentOrganization: () => request<Organization>("/organizations/current"),
  team: () => request<Team>("/organizations/team"),
  inviteUser: (payload: { email: string; full_name: string; role: "org_admin" | "org_user" }) =>
    request<Team>("/organizations/invites", { method: "POST", body: JSON.stringify(payload) }),
  updateTeamMember: (id: string, payload: Partial<Pick<User, "full_name" | "role" | "is_active">>) =>
    request<User>(`/organizations/team/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  removeTeamMember: (id: string) =>
    request<void>(`/organizations/team/${id}`, { method: "DELETE" }),
  auditLogs: (limit = 25) => request<AuditLogList>(`/organizations/audit-logs?limit=${limit}`),
  platformAnalytics: () => request<PlatformAnalytics>("/platform/analytics"),
  platformOrganizations: () =>
    request<{ items: PlatformOrganization[]; total: number }>("/platform/organizations"),
  createPlatformOrganization: (payload: {
    name: string;
    slug: string;
    country: string;
    admin_email: string;
    admin_full_name: string;
  }) =>
    request<PlatformOrganizationCreated>("/platform/organizations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePlatformOrganization: (id: string, payload: Pick<Organization, "subscription_status">) =>
    request<PlatformOrganization>(`/platform/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  platformUsers: () => request<{ items: User[]; total: number }>("/platform/users"),
  platformAuditLogs: (limit = 50) => request<AuditLogList>(`/platform/audit-logs?limit=${limit}`),
  products: (query: ProductQuery = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.category) params.set("category", query.category);
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("page_size", String(query.pageSize));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<ProductList>(`/products${suffix}`);
  },
  createProduct: (payload: Record<string, unknown>) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Record<string, unknown>) =>
    request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteProduct: (id: string) =>
    request<void>(`/products/${id}`, { method: "DELETE" }),
  addEnvironmentalRecord: (id: string, payload: Record<string, unknown>) =>
    request<Product>(`/products/${id}/environmental-records`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadProductImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ image_url: string }>(`/products/${id}/image`, {
      method: "POST",
      body: formData,
    });
  },
  importProductsCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ImportResult>("/products/imports/csv", { method: "POST", body: formData });
  },
  product: (id: string) => request<Product>(`/products/${id}`),
  passport: (id: string) => request<Record<string, unknown>>(`/passports/${id}`),
  analytics: () =>
    request<{
      product_count: number;
      measured_product_count: number;
      total_co2: number;
      total_energy: number;
      total_water: number;
      average_sustainability_score: number;
      category_breakdown: Array<{
        category: string;
        products: number;
        co2: number;
        water: number;
        energy: number;
        average_score: number;
      }>;
      hotspots: Array<{
        product_id: string;
        name: string;
        category: string;
        image_url: string | null;
        co2: number;
        energy: number;
        water: number;
        sustainability_score: number;
      }>;
      score_distribution: Array<{ label: string; count: number }>;
      trend: Array<{ label: string; co2: number; energy: number; water: number }>;
    }>("/analytics/summary"),
  advisor: (id: string) =>
    request<AdvisorResult>(`/ai/products/${id}/advisor`, { method: "POST" }),
  startAdvisorJob: (id: string) =>
    request<AIJob>(`/ai/products/${id}/advisor/jobs`, { method: "POST" }),
  report: (id: string) =>
    request<ReportResult>(`/ai/products/${id}/report`, {
      method: "POST",
    }),
  startReportJob: (id: string) =>
    request<AIJob>(`/ai/products/${id}/report/jobs`, { method: "POST" }),
  aiJob: (id: string) => request<AIJob>(`/ai/jobs/${id}`),
  certificates: () => request<CertificateExtractionList>("/certificates"),
  extractCertificate: (payload: { file: File; productId?: string }) => {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.productId) formData.append("product_id", payload.productId);
    return request<CertificateExtraction>("/certificates/extract", {
      method: "POST",
      body: formData,
    });
  },
  updateCertificate: (id: string, payload: Partial<CertificateExtraction>) =>
    request<CertificateExtraction>(`/certificates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
