import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Brain, FileBadge, GitCompareArrows, Leaf, LogOut, Package, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/products", label: "Products", icon: Package },
  { to: "/passports", label: "Passports", icon: FileBadge },
  { to: "/benchmarking", label: "Benchmarking", icon: GitCompareArrows },
  { to: "/advisor", label: "AI Advisor", icon: Brain },
  { to: "/certificates", label: "Certificates", icon: ShieldCheck },
];

export function AppShell() {
  const { user, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();
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
      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
          <div>
            <div className="text-sm text-muted-foreground">Tenant workspace</div>
            <div className="font-semibold">{user?.full_name ?? "Demo user"}</div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              logout();
              addToast({ title: "Signed out", variant: "success" });
              navigate("/login");
            }}
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
