"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useDialogFocusTrap } from "@/lib/hooks/use-dialog-focus-trap";
import { animateDialogEnter, animateDialogExit } from "@/lib/motion/anime";
import { cn } from "@/lib/utils";

export type PageWidth = "list" | "detail" | "writing" | "canvas";

const widthClasses: Record<PageWidth, string> = {
  list: "workspace-page workspace-page--list",
  detail: "workspace-page workspace-page--detail",
  writing: "workspace-page workspace-page--writing",
  canvas: "workspace-page workspace-page--canvas",
};

export function PageContainer({
  children,
  className,
  width = "list",
  ariaLabelledBy,
}: {
  children: ReactNode;
  className?: string;
  width?: PageWidth;
  ariaLabelledBy?: string;
}) {
  return <div aria-labelledby={ariaLabelledBy} className={cn(widthClasses[width], className)}>{children}</div>;
}

export function PageHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <header className={cn("workspace-page-header", className)}>{children}</header>;
}

export function WorkspacePageHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <PageHeader className={className}>{children}</PageHeader>;
}

export function DetailPageHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <PageHeader className={cn("workspace-detail-header", className)}>{children}</PageHeader>;
}

export function Section({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cn("workspace-section", className)}>
      {title || action ? (
        <div className="workspace-section__header">
          {title ? <h2 className="workspace-section__title">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Surface({
  children,
  className,
  ariaLabelledBy,
}: {
  children: ReactNode;
  className?: string;
  ariaLabelledBy?: string;
}) {
  return <div aria-labelledby={ariaLabelledBy} className={cn("workspace-surface", className)}>{children}</div>;
}

export function ListRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <li className={cn("workspace-list-row", className)}>{children}</li>;
}

export function PropertyList({ children }: { children: ReactNode }) {
  return <dl className="workspace-property-list">{children}</dl>;
}

export function PropertyRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("workspace-property-row", className)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  className,
}: {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  if (!icon && !title && !description && !action && children) {
    return <div className={cn("workspace-empty", className)}>{children}</div>;
  }

  return (
    <div className={cn("workspace-empty flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)]/50", className)}>
      {icon ? <div className="mb-3 text-[var(--ink-faint)] flex items-center justify-center">{icon}</div> : null}
      {title ? <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3> : null}
      {description ? <p className="mt-1 text-xs text-[var(--ink-muted)] max-w-sm">{description}</p> : null}
      {children ? <div className="mt-3 text-xs text-[var(--ink-muted)]">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("workspace-action-bar", className)}>{children}</div>;
}

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

export function Badge({
  children,
  className,
  variant = "default",
  size = "md",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-md tracking-[0.02em] select-none transition-colors",
        size === "md" && "h-6 px-2 text-xs",
        size === "sm" && "h-5 px-1.5 text-[11px]",
        variant === "default" && "bg-[var(--surface-muted)] text-[var(--ink-soft)]",
        variant === "accent" && "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
        variant === "success" && "bg-[var(--success-soft)] text-[var(--success)]",
        variant === "warning" && "bg-[var(--warning-soft)] text-[var(--warning)]",
        variant === "danger" && "bg-[var(--danger-soft)] text-[var(--danger)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function WorkspaceDialog({
  children,
  closeLabel,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  closeLabel: string;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef<boolean>(false);
  const titleId = useId();

  const requestClose = useCallback((): void => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    animateDialogExit(backdropRef.current, dialogRef.current, () => {
      isClosingRef.current = false;
      onClose();
    });
  }, [onClose]);

  useDialogFocusTrap({ dialogRef, onEscape: requestClose, open });

  useEffect(() => {
    if (!open) return;
    isClosingRef.current = false;

    const cleanup = animateDialogEnter(backdropRef.current, dialogRef.current);
    return () => {
      cleanup?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    (
    <div
      ref={backdropRef}
      className="workspace-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="workspace-dialog"
        role="dialog"
        tabIndex={-1}
      >
        <div className="workspace-dialog__header">
          <h2 id={titleId} className="text-base font-semibold text-[var(--ink)]">
            {title}
          </h2>
          <button
            aria-label={closeLabel}
            className="workspace-dialog__close flex size-8 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
            data-dialog-close
            onClick={requestClose}
            type="button"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <div className="workspace-dialog__body pt-4">
          {children}
        </div>
      </div>
    </div>
    ),
    document.body,
  );
}
