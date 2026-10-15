"use client";

import { useRouter } from "next/navigation";
import { useRef, type TouchEvent } from "react";

const EDGE_PX = 28;

/**
 * iOS-style swipe from the left edge to go back. In a home-screen web app
 * there's no browser gesture for this, so the screen provides its own.
 */
export function useEdgeSwipeBack(href: string) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dx = useRef(0);

  const setX = (x: number, animate: boolean) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = animate ? "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
    el.style.transform = x ? `translateX(${x}px)` : "";
  };

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    start.current = t.clientX <= EDGE_PX ? { x: t.clientX, y: t.clientY } : null;
    dx.current = 0;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!start.current) return;
    const t = e.touches[0];
    const moveX = t.clientX - start.current.x;
    // A mostly vertical drag is a scroll, not a back swipe.
    if (dx.current === 0 && Math.abs(t.clientY - start.current.y) > Math.abs(moveX)) {
      start.current = null;
      return;
    }
    dx.current = Math.max(0, moveX);
    setX(dx.current, false);
  };

  const onTouchEnd = () => {
    if (!start.current) return;
    start.current = null;
    const width = ref.current?.offsetWidth ?? 390;
    if (dx.current > width * 0.3) {
      setX(width, true);
      setTimeout(() => router.push(href), 200);
    } else {
      setX(0, true);
    }
  };

  return { ref, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd };
}
