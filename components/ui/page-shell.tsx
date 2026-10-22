"use client";

import { useRef } from "react";
import type { ReactNode, Ref, TouchEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

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
  const router = useRouter();
  const pathname = usePathname();

  // 终极安全返回：如果 router.back() 失效，强行回主页
  const handleSafeBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
    
    // 兜底补救：延迟 150ms 检查，如果还在当前页面（说明没退回去），强行 push 到主桌面
    setTimeout(() => {
      if (window.location.pathname === pathname && pathname !== "/") {
        router.push("/");
      }
    }, 150);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
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

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || start.ignored) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // 只要滑过 30 像素就判定为有效
    if (Math.abs(dx) < 30) return;
    if (Math.abs(dy) > 100) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.1) return;

    // 触发返回
    handleSafeBack();
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
          <button
            className="page-back-btn"
            type="button"
            onClick={handleSafeBack}
            aria-label="返回"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
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

// ... 保留底部的 PageOverlayHeader 代码不变 ...
