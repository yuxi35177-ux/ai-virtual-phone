"use client";

import { useEffect, useRef, type RefObject } from "react";

const IGNORE = "input,textarea,select,[contenteditable='true'],[role='slider'],[data-no-swipe-back],[data-horizontal-scroll],.ui-swipe-wrap,canvas,video,iframe";
// Styling classes are shared by chat's +/menu buttons; only explicit back
// semantics identify a navigation action.
const BACK = "[data-phone-back],button[aria-label='返回'],button[aria-label='返回上一级']";

/** One gesture owner for the whole phone, including pages which do not use PageShell. */
export function usePhoneBack(
  shellRef: RefObject<HTMLDivElement | null>,
  appOpen: boolean,
  closeApp: () => void,
) {
  const current = useRef({ appOpen, closeApp });
  current.current = { appOpen, closeApp };

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    let start: { x: number; y: number; time: number; horizontal: boolean } | null = null;
    let lastBack = 0;
    let suppressClickUntil = 0;
    const visible = (el: HTMLElement) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
    const back = () => {
      if (!current.current.appOpen || Date.now() - lastBack < 350) return;
      lastBack = Date.now();
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>("[role='dialog'],[aria-modal='true']")).filter(visible);
      const root = dialogs.at(-1) ?? shell;
      const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>(BACK)).filter(el => visible(el) && !el.disabled);
      const button = buttons.at(-1);
      if (button) button.click();
      else if (!dialogs.length) current.current.closeApp();
    };
    const onStart = (event: TouchEvent) => {
      start = null;
      if (!current.current.appOpen || event.touches.length !== 1) return;
      const target = event.target;
      if (!(target instanceof Element) || target.closest(IGNORE)) return;
      if (Array.from(document.querySelectorAll<HTMLElement>("[role='dialog'],[aria-modal='true']")).some(visible)) return;
      // Preserve controls which already consume horizontal dragging, including carousels.
      for (let el: Element | null = target; el && el !== shell; el = el.parentElement) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 2) return;
      }
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, time: Date.now(), horizontal: false };
    };
    const onMove = (event: TouchEvent) => {
      if (!start) return;
      if (event.touches.length !== 1) { start = null; return; }
      const dx = Math.abs(event.touches[0].clientX - start.x);
      const dy = Math.abs(event.touches[0].clientY - start.y);
      if (!start.horizontal) {
        if (dy > 12 && dy >= dx) { start = null; return; }
        if (dx > 14 && dx > dy * 1.5) start.horizontal = true;
      }
      if (start.horizontal && event.cancelable) event.preventDefault();
    };
    const onEnd = (event: TouchEvent) => {
      const gesture = start;
      start = null;
      if (!gesture || event.touches.length || Date.now() - gesture.time > 1200) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = Math.abs(touch.clientX - gesture.x);
      const dy = Math.abs(touch.clientY - gesture.y);
      if (dx < 64 || dx < dy * 1.8) return;
      if (event.cancelable) event.preventDefault();
      suppressClickUntil = Date.now() + 450;
      back();
    };
    const onCancel = () => { start = null; };
    const onClick = (event: MouseEvent) => {
      if (event.isTrusted && Date.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    const onNativeBack = (event: Event) => { event.preventDefault(); back(); };
    // Reuse the SAME two history entries. Pushing a replacement in popstate
    // consumes Chromium's activation and can make the next system Back skip
    // the phone entirely. Forward traversal restores the existing guard.
    const guardKey = "__floatPhoneBackGuard";
    let guardReady = false;
    let restoring = false;
    const addGuard = () => {
      if (restoring || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return;
      if (!window.history.state?.[guardKey]) {
        window.history.pushState({ ...window.history.state, [guardKey]: true }, "", window.location.href);
      }
      guardReady = true;
    };
    const onPop = (event: PopStateEvent) => {
      if (!guardReady) return;
      if (restoring) { restoring = false; return; }
      if (event.state?.[guardKey]) return;
      restoring = true;
      window.history.forward();
      back();
    };
    addGuard();
    window.addEventListener("popstate", onPop);
    shell.addEventListener("pointerup", addGuard, true);
    shell.addEventListener("touchend", addGuard, true);
    window.addEventListener("floatphone:back", onNativeBack);
    shell.addEventListener("touchstart", onStart, { capture: true, passive: true });
    shell.addEventListener("touchmove", onMove, { capture: true, passive: false });
    shell.addEventListener("touchend", onEnd, { capture: true, passive: false });
    shell.addEventListener("touchcancel", onCancel, true);
    shell.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("popstate", onPop);
      shell.removeEventListener("pointerup", addGuard, true);
      shell.removeEventListener("touchend", addGuard, true);
      window.removeEventListener("floatphone:back", onNativeBack);
      shell.removeEventListener("touchstart", onStart, true);
      shell.removeEventListener("touchmove", onMove, true);
      shell.removeEventListener("touchend", onEnd, true);
      shell.removeEventListener("touchcancel", onCancel, true);
      shell.removeEventListener("click", onClick, true);
    };
  }, [shellRef]);
}
