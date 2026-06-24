import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Brain, Building2, Calculator, ClipboardCheck, FileText, FileBadge, GitCompareArrows, Leaf, LogOut, Menu, Package, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { roleLabel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const tenantNav = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/products", label: "Products", icon: Package },
  { to: "/passports", label: "Passports", icon: FileBadge },
  { to: "/benchmarking", label: "Benchmarking", icon: GitCompareArrows },
  { to: "/lca", label: "LCA Engine", icon: Calculator },
  { to: "/organization", label: "Organization", icon: Building2 },
  { to: "/advisor", label: "AI Advisor", icon: Brain },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/compliance", label: "Compliance", icon: ClipboardCheck },
  { to: "/certificates", label: "Certificates", icon: ShieldCheck },
];

const platformNav = [
  { to: "/platform", label: "Platform", icon: ShieldCheck },
];

export function AppShell() {
  const { user, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const nav = user?.role === "super_admin" ? platformNav : tenantNav;
  const signOut = () => {
    logout();
    addToast({ title: "Signed out", variant: "success" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card p-4 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <Leaf size={20} />
          </div>
          <div>
            <div className="font-semibold">Material Passport OS</div>
            <div className="text-xs text-muted-foreground">Climate product operations</div>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-card p-4 shadow-xl">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Leaf size={20} />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">Material Passport OS</div>
                  <div className="truncate text-xs text-muted-foreground">Climate product operations</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                    )
                  }
                >
                  <item.icon size={17} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              className="lg:hidden"
              variant="secondary"
              size="icon"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Tenant workspace</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold">{user?.full_name ?? "Demo user"}</span>
                <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                  {roleLabel(user)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={signOut}
          >
            <LogOut size={16} />
            Sign out
          </Button>
        </header>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
