"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Suppress console logs in production if needed, or send to observability
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="my-4 rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)]/50 p-6 text-center text-sm shadow-xs"
        >
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[var(--danger-soft)] text-lg text-[var(--danger)]">
            !
          </div>
          <h3 className="mt-3 font-serif text-base font-semibold text-[var(--danger)]">
            {this.props.fallbackTitle ?? "组件渲染发生异常"}
          </h3>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            {this.props.fallbackMessage ?? this.state.error?.message ?? "请尝试重新加载该模块"}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={this.handleReset}>
              重试恢复
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
