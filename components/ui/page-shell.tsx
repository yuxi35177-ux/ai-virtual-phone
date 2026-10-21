"use client";

import { useRef } from "react";
import type { ReactNode, Ref, TouchEvent } from "react";
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
  const touchStartRef = useRef<{
    x: number;
    y: number;
    ignored: boolean;
  } | null>(null);

  const handleTouchStart = (
    event: TouchEvent<HTMLDivElement>
  ) => {
    if (!onBack || event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    const target = event.target;

    const ignored =
      target instanceof Element &&
      Boolean(
        target.closest(
          'input, textarea, select, button, a, [role="button"], [data-no-swipe-back], [data-horizontal-scroll], [contenteditable="true"]'
        )
      );

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      ignored,
    };
  };

  const handleTouchEnd = (
    event: TouchEvent<HTMLDivElement>
  ) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (
      !onBack ||
      !start ||
      start.ignored ||
      event.changedTouches.length !== 1
    ) {
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // 左右滑动都可以返回上一层。
    // 不在移动过程中更新 React 状态。
    if (
      Math.abs(dx) >= 55 &&
      Math.abs(dy) <= 75 &&
      Math.abs(dx) > Math.abs(dy) * 1.25
    ) {
      onBack();
    }
  };

  return (
    <div
      className={`page-shell ${className ?? ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
      }}
    >
      <header className="page-header" data-ui="header">
        <div className="page-header-safe-area" />

        <div className="page-header-content">
          {onBack ? (
            <button
              className="page-back-btn"
              type="button"
              onClick={onBack}
              aria-label="返回"
            >
              <ChevronLeft
                size={24}
                strokeWidth={1.5}
              />
            </button>
          ) : leftAction ? (
            <span>{leftAction}</span>
          ) : (
            <span style={{ width: 40 }} />
          )}

          <span className="page-title">
            {title}
          </span>

          <span className="page-header-right">
            {rightAction ?? (
              <span style={{ width: 40 }} />
            )}
          </span>
        </div>
      </header>

      <div
        ref={bodyRef}
        className="page-body"
        data-ui="body"
      >
        {children}
      </div>

      {footer}
    </div>
  );
}

type PageOverlayHeaderProps = {
  title: ReactNode;
  onBack: () => void;
  rightAction?: ReactNode;
  className?: string;
};

export function PageOverlayHeader({
  title,
  onBack,
  rightAction,
  className,
}: PageOverlayHeaderProps) {
  return (
    <header
      className={`page-header pointer-events-none absolute top-0 left-0 right-0 z-10 ${className ?? ""}`}
    >
      <div className="page-header-safe-area" />

      <div className="page-header-content">
        <button
          className="page-back-btn pointer-events-auto"
          type="button"
          onClick={onBack}
          aria-label="返回"
        >
          <ChevronLeft
            size={24}
            strokeWidth={1.5}
          />
        </button>

        <span className="page-title">
          {title}
        </span>

        <span className="page-header-right pointer-events-auto">
          {rightAction ?? (
            <span style={{ width: 40 }} />
          )}
        </span>
      </div>
    </header>
  );
}
