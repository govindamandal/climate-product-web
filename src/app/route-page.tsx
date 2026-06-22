import { Suspense, type ReactNode } from "react";
import { LoadingState } from "@/components/ui/loading-state";

export function RoutePage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>;
}
