"use client";

import { useState, type ReactNode, type UIEvent } from "react";
import { PEOPLE } from "@/lib/people";
import type { Person } from "@/lib/types";

/** Top bar: transparent at rest, frosted with a hairline once content scrolls under it. */
export function NavBar({
  left,
  center,
  right,
  solid = false,
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  solid?: boolean;
}) {
  return (
    <header
      className={`pt-safe absolute inset-x-0 top-0 z-20 border-b transition-colors duration-200 ${
        solid ? "border-border/70 bg-bar backdrop-blur-xl" : "border-transparent"
      }`}
    >
      <div className="grid h-12 grid-cols-[6rem_1fr_6rem] items-center px-2">
        <div className="justify-self-start">{left}</div>
        <div className="min-w-0 justify-self-center text-center">{center}</div>
        <div className="justify-self-end">{right}</div>
      </div>
    </header>
  );
}

/**
 * A screen with an iOS large title that collapses into the nav bar on scroll.
 * Content scrolls under the (absolutely positioned) bars.
 */
export function LargeTitleScreen({
  eyebrow,
  title,
  navLeft,
  navRight,
  children,
  bottomInset = 0,
}: {
  eyebrow?: string;
  title: string;
  navLeft?: ReactNode;
  navRight?: ReactNode;
  children: ReactNode;
  bottomInset?: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    if (y > 4 !== scrolled) setScrolled(y > 4);
    if (y > 64 !== collapsed) setCollapsed(y > 64);
  };

  return (
    <>
      <NavBar
        solid={scrolled}
        left={navLeft}
        right={navRight}
        center={
          <span
            className={`block truncate text-[17px] font-semibold transition-all duration-200 ${
              collapsed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {title}
          </span>
        }
      />
      <div
        onScroll={onScroll}
        style={{ paddingBottom: `calc(${bottomInset}px + env(safe-area-inset-bottom))` }}
        className="h-full overflow-y-auto overscroll-contain px-4 pt-[calc(env(safe-area-inset-top)+3rem)]"
      >
        <div className="pt-2 pb-5">
          {eyebrow && (
            <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">{eyebrow}</p>
          )}
          <h1 className="font-display text-[36px] italic leading-tight">{title}</h1>
        </div>
        {children}
      </div>
    </>
  );
}

const AVATAR_TINT: Record<Person, string> = {
  on: "bg-[var(--tint-2)]",
  ona: "bg-[var(--tint-1)]",
};

/** Round avatar: the person's memoji on their tint. */
export function Avatar({ person, size }: { person: Person; size: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-card ${AVATAR_TINT[person]}`}
    >
      {/* Plain img: static export has no image optimizer, and the file is already sized. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PEOPLE[person].avatar}
        alt={PEOPLE[person].name}
        width={size}
        height={size}
        draggable={false}
        className={`size-full object-contain ${PEOPLE[person].avatarFit}`}
      />
    </span>
  );
}

export type TabItem<T extends string> = { id: T; label: string; icon: ReactNode };

/** Floating glass tab bar, in the style of current iOS. */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <nav
      role="tablist"
      className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[max(env(safe-area-inset-bottom),12px)]"
    >
      <div className="flex gap-1 rounded-full border border-white/40 bg-bar p-1.5 shadow-[0_10px_40px_-10px_rgb(74_43_63/0.35)] backdrop-blur-2xl dark:border-white/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => onChange(t.id)}
            className={`flex h-12 min-w-24 flex-col items-center justify-center gap-0.5 rounded-full px-5 text-[10px] font-semibold outline-none transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent ${
              active === t.id ? "bg-accent-soft text-accent" : "text-muted"
            }`}
          >
            <span className="size-6">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/** Height the floating tab bar covers, so scroll content can clear it. */
export const TAB_BAR_INSET = 92;

/** Calendar with a heart: our days. */
export function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="size-full">
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M12 17.2s-2.6-1.5-2.6-3.2a1.3 1.3 0 0 1 2.6-.4 1.3 1.3 0 0 1 2.6.4c0 1.7-2.6 3.2-2.6 3.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Sparkles, for the fun facts. */
export function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" className="size-full">
      <path d="M10 3.5c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6Z" />
      <path d="M18 14c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3Z" />
    </svg>
  );
}

export function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="size-6">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
