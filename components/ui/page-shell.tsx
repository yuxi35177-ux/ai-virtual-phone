
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
  // 使用 ref 记录手势，不在手指移动时触发 React 重新渲染。
  const touchStartRef = useRef<{
    x: number;
    y: number;
    ignored: boolean;
  } | null>(null);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!onBack || event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const target = event.target;
    const ignored =
      target instanceof Element &&
      Boolean(
        target.closest(
          'input, textarea, select, button, a, [role="button"], [data-no-swipe-back], [data-horizontal-scroll]'
        )
      );

    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      ignored,
    };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
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

    // 只识别明显的水平滑动，避免干扰上下滚动。
    if (
      Math.abs(dx) >= 76 &&
      Math.abs(dy) <= 56 &&
      Math.abs(dx) > Math.abs(dy) * 1.35
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
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>
          ) : leftAction ? (
            <span>{leftAction}</span>
          ) : (
            <span style={{ width: 40 }} />
          )}

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

/**
 * 画布类页面使用的悬浮标题栏。
 * 保留画布交互，返回按钮仍可点击。
 */
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
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>

        <span className="page-title">{title}</span>

        <span className="page-header-right pointer-events-auto">
          {rightAction ?? <span style={{ width: 40 }} />}
        </span>
      </div>
    </header>
  );
}
