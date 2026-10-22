"use client";

import type { ReactNode, Ref } from "react";
import { ChevronLeft } from "lucide-react";

type PageShellProps = {
  title?: ReactNode;
  onBack?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyRef?: Ref<HTMLDivElement>;
};

export function PageShell({
  title = "",
  onBack,
  leftAction,
  rightAction,
  children,
  footer,
  className,
  bodyRef,
}: PageShellProps) {
  return (
    <div
      className={`page-shell ${className ?? ""}`}
    >
      <header className="page-header" data-ui="header">
        <div className="page-header-safe-area" />
        <div className="page-header-content">
          {leftAction ?? (onBack ? (
            <button
              className="page-back-btn"
              type="button"
              onClick={onBack}
              data-phone-back
              aria-label="返回"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>
          ) : <span style={{ width: 40 }} />)}
          <span className="page-title">{title}</span>
          <span className="page-header-right">
            {rightAction ?? <span style={{ width: 40 }} />}
          </span>
        </div>
      </header>

      <div ref={bodyRef} className="page-body" data-ui="body">
        {children}
      </div>

      {footer}
    </div>
  );
}

export function PageOverlayHeader({
  title = "", onBack, leftAction, rightAction,
}: Pick<PageShellProps, "title" | "onBack" | "leftAction" | "rightAction">) {
  return (
    <header className="page-header" data-ui="header">
      <div className="page-header-safe-area" />
      <div className="page-header-content">
        {leftAction ?? (onBack ? (
          <button className="page-back-btn" type="button" onClick={onBack} data-phone-back aria-label="返回">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
        ) : <span style={{ width: 40 }} />)}
        <span className="page-title">{title}</span>
        <span className="page-header-right">{rightAction ?? <span style={{ width: 40 }} />}</span>
      </div>
    </header>
  );
}
