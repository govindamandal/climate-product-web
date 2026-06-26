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
  actor_email: string | null;
  actor_full_name: string | null;
  organization_name: string | null;
  description: string | null;
};
export type AuditLogList = {
  items: AuditLog[];
  total: number;
};
export type AuditLogQuery = {
  limit?: number;
  action?: string;
  entityType?: string;
  search?: string;
};
export type PlatformOrganization = Organization & {
  user_count: number;
  product_count: number;
  billing_plan_key: string | null;
  billing_plan_name: string | null;
  billing_cycle: string | null;
  billing_status: string | null;
};
export type PlatformAnalytics = {
  organization_count: number;
  active_subscription_count: number;
  user_count: number;
  product_count: number;
  audit_log_count: number;
};
export type OperationsStatus = {
  status: "ok" | "degraded" | "error";
  service: string;
  environment: string;
  uptime_seconds: number;
  generated_at: string;
  checks: Array<{
    name: string;
    status: "ok" | "degraded" | "error";
    latency_ms: number | null;
    detail: string | null;
  }>;
};
export type PlatformOrganizationCreated = {
  organization: PlatformOrganization;
  admin: User;
  temporary_password: string;
  created_at: string;
};
export type OrganizationPrivacySettings = {
  id: string;
  organization_id: string;
  data_region: string;
  retention_period_days: number;
  allow_ai_processing: boolean;
  allow_public_passport_sharing: boolean;
  require_verification_for_exports: boolean;
  data_processing_contact_email: string | null;
  updated_at: string;
};
export type OrganizationPrivacySettingsUpdate = Partial<
  Pick<
    OrganizationPrivacySettings,
    | "data_region"
    | "retention_period_days"
    | "allow_ai_processing"
    | "allow_public_passport_sharing"
    | "require_verification_for_exports"
    | "data_processing_contact_email"
  >
>;
export type DataGovernanceRequest = {
  id: string;
  organization_id: string;
  requested_by_user_id: string | null;
  requested_by_email: string | null;
  reviewed_by_user_id: string | null;
  reviewed_by_email: string | null;
  request_type: "export" | "deletion" | "correction";
  subject_type: "organization" | "product" | "user" | "certificate" | "report";
  subject_id: string;
  status: "open" | "completed" | "rejected";
  reason: string;
  resolution_notes: string;
  created_at: string;
  resolved_at: string | null;
};
export type DataGovernanceRequestList = {
  items: DataGovernanceRequest[];
  total: number;
};
export type BillingPlan = {
  key: string;
  name: string;
  description: string;
  monthly_price_inr: number;
  annual_price_inr: number;
  seats_included: number;
  products_included: number;
  features: string[];
};
export type BillingSummary = {
  subscription: {
    id: string;
    organization_id: string;
    plan_key: string;
    plan_name: string;
    billing_cycle: "monthly" | "annual";
    status: "trial" | "active" | "past_due" | "canceled";
    seats_included: number;
    products_included: number;
    provider: string;
    provider_customer_id: string | null;
    provider_subscription_id: string | null;
    trial_ends_at: string;
    current_period_ends_at: string;
    cancel_at_period_end: boolean;
    updated_at: string;
  };
  current_plan: BillingPlan;
  usage: {
    users: number;
    products: number;
    seats_included: number;
    products_included: number;
    seat_utilization_pct: number;
    product_utilization_pct: number;
  };
  invoices: Array<{
    id: string;
    invoice_number: string;
    amount_inr: number;
    status: string;
    invoice_url: string | null;
    issued_at: string;
    due_at: string | null;
    paid_at: string | null;
  }>;
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
  product_code: string;
  declared_unit: string;
  functional_unit: string;
  lifecycle_scope: string;
  reference_service_life_years: number | null;
  manufacturing_site: string;
  plant_code: string;
  product_standard: string;
  pcr: string;
  geography: string;
  data_quality: string;
  technical_properties: Record<string, unknown>;
  image_url: string | null;
  material_composition: Record<string, unknown>;
  material_components: ProductMaterialComponent[];
  certifications: Array<Record<string, unknown>>;
  environmental_records: EnvironmentalRecord[];
  created_at: string;
  updated_at: string;
};

export type ProductMaterialComponent = {
  id?: string;
  product_id?: string;
  material_name: string;
  category: string;
  percentage: number;
  recycled_content_pct: number;
  bio_based_content_pct: number;
  supplier: string;
  origin_country: string;
  evidence_reference: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
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
  document_type: string | null;
  extraction_method: string | null;
  extraction_confidence: number | null;
  field_confidence_json: Record<string, number> | null;
  evidence_json: Record<string, string | null> | null;
  review_notes: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
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
  safety: AISafetyMetadata;
  recommendations: Array<{
    title: string;
    category: string;
    impact: string;
    rationale: string;
    next_step: string;
  }>;
};
export type AISafetyMetadata = {
  status: string;
  provider: string;
  execution_mode: string;
  policy_version: string;
  data_policy: string;
  validation_notes: string[];
  disclaimers: string[];
};
export type ReportResult = {
  product_id: string;
  provider: string;
  safety: AISafetyMetadata;
  summary: string;
  markdown: string;
};
export type AIJob = {
  id: string;
  organization_id: string;
  product_id: string;
  job_type: "advisor" | "report";
  status: "pending" | "running" | "succeeded" | "failed";
  provider: string | null;
  safety_status: string | null;
  safety_metadata_json: Record<string, unknown> | null;
  result_json: Record<string, unknown> | null;
  error_message: string | null;
};
export type BenchmarkItem = {
  product_id: string;
  name: string;
  category: string;
  manufacturer: string;
  image_url: string | null;
  co2_kg: number;
  water_liters: number;
  energy_kwh: number;
  transportation_kg_co2: number;
  sustainability_score: number;
  co2_percentile: number;
  water_percentile: number;
  energy_percentile: number;
  score_percentile: number;
  category_average_co2: number;
  category_average_water: number;
  category_average_energy: number;
  category_average_score: number;
  co2_vs_category_pct: number;
  water_vs_category_pct: number;
  energy_vs_category_pct: number;
  score_vs_category_points: number;
};
export type BenchmarkResponse = {
  items: BenchmarkItem[];
  category_averages: Array<{
    category: string;
    measured_products: number;
    average_co2: number;
    average_water: number;
    average_energy: number;
    average_score: number;
  }>;
  portfolio: {
    measured_products: number;
    category_count: number;
    best_carbon_product_id: string | null;
    best_score_product_id: string | null;
  };
};
export type ComplianceReport = {
  product_id: string;
  product_name: string;
  readiness_score: number;
  summary: string;
  sections: string[];
  checks: Array<{
    key: string;
    label: string;
    status: "ready" | "needs_review" | "missing";
    evidence: string;
    recommendation: string;
  }>;
  markdown: string;
  report_json: Record<string, unknown>;
};
export type ProductVerification = {
  id: string;
  organization_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  requested_by_user_id: string | null;
  requested_by_email: string | null;
  reviewed_by_user_id: string | null;
  reviewed_by_email: string | null;
  status: "submitted" | "approved" | "rejected";
  verification_type: string;
  scope: string;
  evidence_summary: string;
  requester_notes: string;
  reviewer_notes: string;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};
export type ProductVerificationList = {
  items: ProductVerification[];
  total: number;
};
export type EmissionFactor = {
  id: string;
  organization_id: string | null;
  name: string;
  category: string;
  lifecycle_stage: string;
  unit: string;
  factor_kg_co2e: number;
  geography: string;
  source: string;
  version: string;
  notes: string;
};
export type LcaInput = {
  stage: string;
  activity_name: string;
  quantity: number;
  unit: string;
  emission_factor_id?: string;
  emission_factor_kg_co2e?: number;
  data_quality: "measured" | "hybrid" | "estimated";
  notes?: string;
};
export type LcaCalculation = {
  id: string;
  organization_id: string;
  product_id: string;
  created_by_user_id: string | null;
  declared_unit: string;
  boundary: string;
  method_version: string;
  total_kg_co2e: number;
  confidence: string;
  inputs_json: Array<Record<string, unknown>>;
  stage_totals_json: Record<string, number>;
  result_json: Record<string, unknown>;
  notes: string;
  created_at: string;
};
export type LcaCalculationList = {
  items: LcaCalculation[];
  total: number;
};
export type PassportShare = {
  id: string;
  product_id: string;
  token: string;
  share_url: string;
  is_active: boolean;
  created_at: string;
};
export type PublicPassport = {
  product: Product;
  latest_environmental_record: EnvironmentalRecord | null;
  sustainability_score: number;
  passport_json: Record<string, unknown>;
  share: PassportShare;
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
  billingPlans: () => request<BillingPlan[]>("/billing/plans"),
  currentBilling: () => request<BillingSummary>("/billing/current"),
  updateCurrentBilling: (payload: { plan_key: string; billing_cycle: "monthly" | "annual" }) =>
    request<BillingSummary>("/billing/current", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  currentOrganization: () => request<Organization>("/organizations/current"),
  team: () => request<Team>("/organizations/team"),
  inviteUser: (payload: { email: string; full_name: string; role: "org_admin" | "org_user" }) =>
    request<Team>("/organizations/invites", { method: "POST", body: JSON.stringify(payload) }),
  updateTeamMember: (id: string, payload: Partial<Pick<User, "full_name" | "role" | "is_active">>) =>
    request<User>(`/organizations/team/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  removeTeamMember: (id: string) =>
    request<void>(`/organizations/team/${id}`, { method: "DELETE" }),
  auditLogs: (query: AuditLogQuery = {}) => {
    const params = auditParams(query, 25);
    return request<AuditLogList>(`/organizations/audit-logs?${params.toString()}`);
  },
  privacySettings: () => request<OrganizationPrivacySettings>("/organizations/privacy-settings"),
  updatePrivacySettings: (payload: OrganizationPrivacySettingsUpdate) =>
    request<OrganizationPrivacySettings>("/organizations/privacy-settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  dataRequests: (query: { status?: string; requestType?: string } = {}) => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.requestType) params.set("request_type", query.requestType);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<DataGovernanceRequestList>(`/organizations/data-requests${suffix}`);
  },
  createDataRequest: (payload: {
    request_type: DataGovernanceRequest["request_type"];
    subject_type: DataGovernanceRequest["subject_type"];
    subject_id?: string;
    reason?: string;
  }) =>
    request<DataGovernanceRequest>("/organizations/data-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reviewDataRequest: (id: string, payload: { status: "completed" | "rejected"; resolution_notes?: string }) =>
    request<DataGovernanceRequest>(`/organizations/data-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  platformAnalytics: () => request<PlatformAnalytics>("/platform/analytics"),
  operationsStatus: () => request<OperationsStatus>("/operations/status"),
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
  platformAuditLogs: (query: AuditLogQuery = {}) => {
    const params = auditParams(query, 50);
    return request<AuditLogList>(`/platform/audit-logs?${params.toString()}`);
  },
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
  createPassportShare: (id: string) =>
    request<PassportShare>(`/passports/${id}/shares`, { method: "POST" }),
  publicPassport: (token: string) => request<PublicPassport>(`/passports/public/${token}`),
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
  benchmarks: () => request<BenchmarkResponse>("/analytics/benchmarks"),
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
  complianceReport: (payload: { product_id: string; sections: string[] }) =>
    request<ComplianceReport>("/compliance/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  indiaComplianceReport: (payload: { product_id: string; sections: string[] }) =>
    request<ComplianceReport>("/compliance/india/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifications: (query: { status?: string; productId?: string } = {}) => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.productId) params.set("product_id", query.productId);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<ProductVerificationList>(`/verifications${suffix}`);
  },
  createVerification: (payload: {
    product_id: string;
    verification_type?: string;
    scope?: string;
    evidence_summary?: string;
    requester_notes?: string;
  }) =>
    request<ProductVerification>("/verifications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reviewVerification: (id: string, payload: { status: "approved" | "rejected"; reviewer_notes?: string }) =>
    request<ProductVerification>(`/verifications/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  emissionFactors: (query: { search?: string; category?: string; stage?: string } = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.category) params.set("category", query.category);
    if (query.stage) params.set("stage", query.stage);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<EmissionFactor[]>(`/lca/emission-factors${suffix}`);
  },
  createLcaCalculation: (productId: string, payload: { declared_unit: string; boundary: string; notes?: string; inputs: LcaInput[] }) =>
    request<LcaCalculation>(`/lca/products/${productId}/calculations`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  lcaCalculations: (productId: string) =>
    request<LcaCalculationList>(`/lca/products/${productId}/calculations`),
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

function auditParams(query: AuditLogQuery, defaultLimit: number) {
  const params = new URLSearchParams();
  params.set("limit", String(query.limit ?? defaultLimit));
  if (query.action) params.set("action", query.action);
  if (query.entityType) params.set("entity_type", query.entityType);
  if (query.search) params.set("search", query.search);
  return params;
}
