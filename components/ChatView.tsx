"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { belgradeParts, formatLongDate, formatTime } from "@/lib/day";
import { useDay, useSearch, useToday } from "@/lib/hooks";
import { PEOPLE, other } from "@/lib/people";
import type { MediaKind, Message, Person } from "@/lib/types";
import { Avatar, ChevronLeft } from "./app-ui";
import { SecureImage } from "./SecureImage";
import { useEdgeSwipeBack } from "./useEdgeSwipeBack";
import { useRequireViewer } from "./useRequireViewer";

// Show a centered timestamp when this much time passes between messages.
const TIME_GAP_MS = 20 * 60 * 1000;

const UNAVAILABLE: Record<MediaKind, string> = {
  photo: "Slika nije dostupna",
  video: "Video nije dostupan",
  gif: "GIF nije dostupan",
  audio: "Glasovna poruka nije dostupna",
  sticker: "Stiker nije dostupan",
};

const ICON_PATHS: Record<MediaKind, ReactNode> = {
  photo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m21 16-5-5-8 8" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="3" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  gif: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M8 10.5h-1.5v3H8M11.5 10v4M14.5 14v-4h2.5M14.5 12H16.5" />
    </>
  ),
  audio: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>
  ),
  sticker: (
    <>
      <path d="M20 12a8 8 0 1 1-8-8h3l5 5v3Z" />
      <path d="M9 14.5s1 1.5 3 1.5 3-1.5 3-1.5M9.5 10h.01M14.5 10h.01" />
    </>
  ),
};

/** A shared photo, or a placeholder for anything we don't show. */
function Attachment({ media, mine }: { media: NonNullable<Message["media"]>; mine: boolean }) {
  if (media.kind === "photo" && media.id) {
    return <SecureImage id={media.id} className="max-h-80 w-56 rounded-2xl bg-card object-cover" />;
  }
  const isPhoto = media.kind === "photo";
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed text-muted ${
        isPhoto ? "aspect-[4/3] w-48" : "w-48 py-4"
      } ${mine ? "border-accent/40 bg-accent-soft/60" : "border-border bg-card"}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-7" aria-hidden>
        {ICON_PATHS[media.kind]}
        <path d="M4 4l16 16" />
      </svg>
      <span className="text-[12px] font-medium">{UNAVAILABLE[media.kind]}</span>
    </div>
  );
}

function Bubble({ message, mine, first, last }: { message: Message; mine: boolean; first: boolean; last: boolean }) {
  const corner = mine
    ? `${first ? "" : "rounded-tr-md"} ${last ? "" : "rounded-br-md"}`
    : `${first ? "" : "rounded-tl-md"} ${last ? "" : "rounded-bl-md"}`;
  if (message.media && !message.text) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`} title={formatTime(message.ts)}>
        <Attachment media={message.media} mine={mine} />
      </div>
    );
  }
  return (
    <div className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
      {message.media && <Attachment media={message.media} mine={mine} />}
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
        // A gap between blocks (whoever writes changes), the tight spacing within one.
        const opensBlock = !showTime && prev.sender !== m.sender;
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
            <div className={opensBlock ? "mt-2" : undefined}>
              <Bubble message={m} mine={m.sender === viewer} first={first} last={breaksAfter} />
            </div>
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
  const byYear = useDay(today);
  const backHref = `/pocetna${search}`;
  const swipe = useEdgeSwipeBack(backHref);

  const thread = byYear ? (byYear.get(year) ?? []) : null;

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
