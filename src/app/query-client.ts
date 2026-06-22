import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { useToastStore } from "@/stores/toast-store";

type ToastMeta = {
  successMessage?: string;
  errorMessage?: string;
};

function toastError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError && error.status === 401) return;
  const message = error instanceof Error ? error.message : fallback;
  useToastStore.getState().addToast({
    title: fallback,
    description: message,
    variant: "error",
  });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toastError(error, "Could not load data"),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const meta = mutation.options.meta as ToastMeta | undefined;
      toastError(error, meta?.errorMessage ?? "Action failed");
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const meta = mutation.options.meta as ToastMeta | undefined;
      if (!meta?.successMessage) return;
      useToastStore.getState().addToast({
        title: meta.successMessage,
        variant: "success",
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
