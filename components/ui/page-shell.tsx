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

type TouchStartPoint = {
  x: number;
  y: number;
  ignored: boolean;
};

const IGNORE_SWIPE_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a",
  "[role='button']",
  "[data-no-swipe-back]",
  "[data-horizontal-scroll]",
].join(",");

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
  const touchStartRef = useRef<TouchStartPoint | null>(null);

  const handleTouchStart = (
    event: TouchEvent<HTMLDivElement>
  ) => {
    const touch = event.touches[0];

    if (!touch) return;

    const target = event.target;

    const ignored =
      target instanceof Element &&
      !!target.closest(IGNORE_SWIPE_SELECTOR);

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

    if (!start || start.ignored || !onBack) return;

    const touch = event.changedTouches[0];

    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // 优化：将短距离滑动阈值降低到 30，轻轻一划就能返回
    if (Math.abs(dx) < 30) return;

    // 优化：将上下滑动的容错率提高到 100，允许手指有一定的倾斜
    if (Math.abs(dy) > 100) return;

    // 优化：放宽横向移动为主的比例判定
    if (Math.abs(dx) < Math.abs(dy) * 1.1) {
      return;
    }

    // 左滑、右滑都返回上一级。
    onBack();
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
  };

  return (
    <div
      className={`page-shell ${className ?? ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{ touchAction: "pan-y" }}
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
      className={`page-header pointer-events-none absolute top-0 left-0 right-0 z-10 ${
        className ?? ""
      }`}
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
          {rightAction ?? (
            <span style={{ width: 40 }} />
          )}
        </span>
      </div>
    </header>
  );
}
