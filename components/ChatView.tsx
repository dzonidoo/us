"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import { belgradeParts, formatLongDate, formatTime } from "@/lib/day";
import { useMessages, useSearch, useToday } from "@/lib/hooks";
import { messagesForDay } from "@/lib/messages";
import { PEOPLE, other } from "@/lib/people";
import type { Message, Person } from "@/lib/types";
import { Avatar, ChevronLeft } from "./app-ui";
import { useEdgeSwipeBack } from "./useEdgeSwipeBack";
import { useRequireViewer } from "./useRequireViewer";

// Show a centered timestamp when this much time passes between messages.
const TIME_GAP_MS = 20 * 60 * 1000;

function Bubble({ message, mine, first, last }: { message: Message; mine: boolean; first: boolean; last: boolean }) {
  const corner = mine
    ? `${first ? "" : "rounded-tr-md"} ${last ? "" : "rounded-br-md"}`
    : `${first ? "" : "rounded-tl-md"} ${last ? "" : "rounded-bl-md"}`;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        title={formatTime(message.ts)}
        className={`max-w-[78%] select-text whitespace-pre-wrap break-words rounded-3xl px-4 py-2.5 text-[15px] leading-snug ${corner} ${
          mine
            ? "bg-bubble-me text-bubble-me-text shadow-[0_6px_16px_-10px_var(--accent)]"
            : "bg-bubble-them text-bubble-them-text shadow-[0_6px_16px_-12px_rgb(74_43_63/0.35)]"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function Thread({ messages, viewer }: { messages: Message[]; viewer: Person }) {
  return (
    <div className="flex flex-col gap-0.5">
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const crossedMidnight = prev && belgradeParts(prev.ts).day !== belgradeParts(m.ts).day;
        const showTime = !prev || crossedMidnight || m.ts - prev.ts >= TIME_GAP_MS;
        const breaksAfter = !next || next.sender !== m.sender || next.ts - m.ts >= TIME_GAP_MS ||
          belgradeParts(next.ts).day !== belgradeParts(m.ts).day;
        const first = showTime || prev.sender !== m.sender;
        return (
          <Fragment key={`${m.ts}-${i}`}>
            {crossedMidnight && (
              <div className="my-6 flex items-center gap-3 text-muted">
                <span className="h-px flex-1 bg-border" />
                <span className="font-display text-sm italic">☾ posle ponoći</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
            {showTime && <div className="mt-5 mb-2 text-center text-[11px] font-medium text-muted">{formatTime(m.ts)}</div>}
            <Bubble message={m} mine={m.sender === viewer} first={first} last={breaksAfter} />
          </Fragment>
        );
      })}
    </div>
  );
}

export function ChatView({ year }: { year: number }) {
  const viewer = useRequireViewer();
  const today = useToday();
  const search = useSearch();
  const messages = useMessages();
  const backHref = `/pocetna${search}`;
  const swipe = useEdgeSwipeBack(backHref);

  const thread = useMemo(
    () => (messages && today ? (messagesForDay(messages, today).get(year) ?? []) : null),
    [messages, today, year],
  );

  if (!viewer || !today) return null;

  const them = other(viewer);

  return (
    <div {...swipe} className="push-in absolute inset-0 bg-background">
      {/* Conversation header: back, avatar, name in one row */}
      <header className="pt-safe absolute inset-x-0 top-0 z-20 border-b border-border/70 bg-bar backdrop-blur-xl">
        <div className="flex h-14 items-center gap-1 px-1.5">
          <Link
            href={backHref}
            aria-label="Nazad na godine"
            className="flex size-11 items-center justify-center rounded-full text-accent outline-none active:opacity-50 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft />
          </Link>
          <Avatar person={them} size={38} />
          <span className="ml-2 text-[17px] font-semibold">{PEOPLE[them].name}</span>
        </div>
      </header>
      <div className="pb-safe h-full overflow-y-auto overscroll-contain px-3 pt-[calc(env(safe-area-inset-top)+3.5rem)]">
        {!thread ? (
          <p className="mt-10 text-center text-muted">Učitavam…</p>
        ) : thread.length === 0 ? (
          <p className="mt-10 text-center text-muted">Tog dana nema poruka.</p>
        ) : (
          <>
            <div className="mt-4 mb-1 flex justify-center">
              <span className="rounded-full bg-card px-3 py-1 text-[12px] font-medium text-muted shadow-[0_4px_12px_-8px_rgb(74_43_63/0.4)]">
                {formatLongDate(today, year)}
              </span>
            </div>
            <Thread messages={thread} viewer={viewer} />
            <p className="my-8 text-center font-display text-sm italic text-muted">☾ kraj dana</p>
          </>
        )}
      </div>
    </div>
  );
}
