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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    request<{ access_token: string; refresh_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: Record<string, unknown>) =>
    request<{ access_token: string; refresh_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<User>("/auth/me"),
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
        co2: number;
        energy: number;
        water: number;
        sustainability_score: number;
      }>;
      score_distribution: Array<{ label: string; count: number }>;
      trend: Array<{ label: string; co2: number; energy: number; water: number }>;
    }>("/analytics/summary"),
  advisor: (id: string) =>
    request<{
      recommendations: Array<{
        title: string;
        category: string;
        impact: string;
        rationale: string;
        next_step: string;
      }>;
    }>(`/ai/products/${id}/advisor`, { method: "POST" }),
};
