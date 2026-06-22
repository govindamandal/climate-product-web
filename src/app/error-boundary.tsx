import { Component, ErrorInfo, ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <EmptyState title="Something went wrong">Refresh the page or retry the action.</EmptyState>;
    }
    return this.props.children;
  }
}
