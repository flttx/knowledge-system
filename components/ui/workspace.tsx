import { useEffect, useRef, type ReactNode } from "react";

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

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("workspace-empty", className)}>{children}</div>;
}

export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("workspace-action-bar", className)}>{children}</div>;
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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button:not([data-dialog-close])",
    );
    firstFocusable?.focus();
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="workspace-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} aria-labelledby="workspace-dialog-title" aria-modal="true" className="workspace-dialog" role="dialog">
        <div className="workspace-dialog__header">
          <h2 id="workspace-dialog-title" className="text-lg font-semibold">{title}</h2>
          <button aria-label={closeLabel} className="workspace-dialog__close" data-dialog-close onClick={onClose} type="button">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
