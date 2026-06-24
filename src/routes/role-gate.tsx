import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { User } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type RoleGateProps = {
  allow: User["role"][];
  children: ReactNode;
  redirectTo?: string;
};

export function RoleGate({ allow, children, redirectTo }: RoleGateProps) {
  const user = useAuthStore((state) => state.user);
  const permitted = user ? allow.includes(user.role) : false;

  if (permitted) return children;
  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return (
    <EmptyState title="Access restricted">
      Your role does not include access to this workspace area.
    </EmptyState>
  );
}
