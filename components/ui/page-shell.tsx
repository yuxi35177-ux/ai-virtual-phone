"use client";

import { useRef, useEffect } from "react";
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

  // 终极安全返回逻辑
  const handleSafeBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }

    // 兜底补救：如果执行了 back 但 150 毫秒后仍停留在当前页（说明历史栈空了导致没反应）
    // 强制直接跳回主桌面，彻底解决“第一次没效果”的问题
    setTimeout(() => {
      if (window.location.pathname === pathname && pathname !== "/") {
        router.push("/");
      }
    }, 150);
  };

  // 拦截安卓系统物理边缘滑动
  useEffect(() => {
    if (pathname === "/") return;

    // 强行向浏览器插入一条历史记录，防止系统的边缘滑动直接退出应用
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // 当系统边缘滑动的灰色箭头触发时，接管操作，执行我们的代码返回逻辑
      handleSafeBack();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

    // 放宽限制：只要存在 onBack 就允许滑动，防止代码没有传 onBack 导致失效
    if (!start || start.ignored) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // 灵敏度拉满：只要滑过 20 像素就判定为有效
    if (Math.abs(dx) < 20) return;
    if (Math.abs(dy) > 100) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.1) return;

    // 代码级滑动也走相同的安全返回逻辑
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
          {onBack ? (
            <button
              className="page-back-btn"
              type="button"
              onClick={handleSafeBack}
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
