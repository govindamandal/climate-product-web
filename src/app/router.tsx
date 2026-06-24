import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/routes/protected-route";
import { RoleGate } from "@/routes/role-gate";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { ResetPasswordPage } from "@/features/auth/reset-password-page";
import { AcceptInvitePage } from "@/features/auth/accept-invite-page";
import { RoutePage } from "@/app/route-page";

const PublicPassportPage = lazy(() => import("@/features/passports/public-passport-page").then((m) => ({ default: m.PublicPassportPage })));
const DashboardPage = lazy(() => import("@/features/dashboard/dashboard-page").then((m) => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import("@/features/products/products-page").then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import("@/features/products/product-detail-page").then((m) => ({ default: m.ProductDetailPage })));
const PassportsPage = lazy(() => import("@/features/passports/passports-page").then((m) => ({ default: m.PassportsPage })));
const BenchmarkingPage = lazy(() => import("@/features/benchmarking/benchmarking-page").then((m) => ({ default: m.BenchmarkingPage })));
const LcaPage = lazy(() => import("@/features/lca/lca-page").then((m) => ({ default: m.LcaPage })));
const OrganizationPage = lazy(() => import("@/features/organization/organization-page").then((m) => ({ default: m.OrganizationPage })));
const PlatformPage = lazy(() => import("@/features/platform/platform-page").then((m) => ({ default: m.PlatformPage })));
const AdvisorPage = lazy(() => import("@/features/ai/advisor-page").then((m) => ({ default: m.AdvisorPage })));
const ReportsPage = lazy(() => import("@/features/reports/reports-page").then((m) => ({ default: m.ReportsPage })));
const CompliancePage = lazy(() => import("@/features/compliance/compliance-page").then((m) => ({ default: m.CompliancePage })));
const CertificatesPage = lazy(() => import("@/features/ai/certificates-page").then((m) => ({ default: m.CertificatesPage })));

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/accept-invite", element: <AcceptInvitePage /> },
  { path: "/share/passports/:token", element: <PublicPassportPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <RoutePage><DashboardPage /></RoutePage> },
          { path: "products", element: <RoutePage><ProductsPage /></RoutePage> },
          { path: "products/:productId", element: <RoutePage><ProductDetailPage /></RoutePage> },
          { path: "passports", element: <RoutePage><PassportsPage /></RoutePage> },
          { path: "benchmarking", element: <RoutePage><BenchmarkingPage /></RoutePage> },
          { path: "lca", element: <RoutePage><LcaPage /></RoutePage> },
          { path: "organization", element: <RoutePage><OrganizationPage /></RoutePage> },
          {
            path: "platform",
            element: (
              <RoutePage>
                <RoleGate allow={["super_admin"]}>
                  <PlatformPage />
                </RoleGate>
              </RoutePage>
            ),
          },
          { path: "advisor", element: <RoutePage><AdvisorPage /></RoutePage> },
          { path: "reports", element: <RoutePage><ReportsPage /></RoutePage> },
          { path: "compliance", element: <RoutePage><CompliancePage /></RoutePage> },
          { path: "certificates", element: <RoutePage><CertificatesPage /></RoutePage> },
        ],
      },
    ],
  },
]);
