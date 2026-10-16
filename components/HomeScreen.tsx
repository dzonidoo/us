"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { dailyYearTints } from "@/lib/colors";
import { formatDayKey, logicalDay } from "@/lib/day";
import { setViewer, useDay, useSearch, useStats, useToday } from "@/lib/hooks";
import { isMuted, setMuted, subscribeMuted } from "@/lib/music";
import {
  Avatar,
  CalendarIcon,
  LargeTitleScreen,
  SoundIcon,
  SparklesIcon,
  TAB_BAR_INSET,
  TabBar,
  type TabItem,
} from "./app-ui";
import { StatsPanel } from "./StatsPanel";
import { useRequireViewer } from "./useRequireViewer";
import { YearCard } from "./YearCard";

type Tab = "vremeplov" | "funfact";

const TABS: TabItem<Tab>[] = [
  { id: "vremeplov", label: "Vremeplov", icon: <CalendarIcon /> },
  { id: "funfact", label: "Fun fact", icon: <SparklesIcon /> },
];

function MuteButton() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-label={muted ? "Uključi muziku" : "Isključi muziku"}
      className="flex size-9 items-center justify-center rounded-full text-muted outline-none transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-accent"
    >
      {/* "us" is all lowercase, so its visual middle sits a little below the row's: meet it there */}
      <span className="block translate-y-[3px]">
        <SoundIcon muted={muted} />
      </span>
    </button>
  );
}

export function HomeScreen() {
  const viewer = useRequireViewer();
  const today = useToday();
  const search = useSearch();
  const [tab, setTab] = useState<Tab>("vremeplov");

  const byYear = useDay(today);
  const stats = useStats();
  const [currentYear] = useState(() => logicalDay(Date.now()).year);
  // Reshuffled every day at 06:00 (when `today` changes), same on both phones.
  const tints = useMemo(
    () => (byYear && today ? dailyYearTints(`${currentYear}-${today}`, [...byYear.keys()]) : null),
    [byYear, today, currentYear],
  );

  if (!viewer || !today) return null;

  const navLeft = (
    <div className="flex items-center">
      <span className="px-2 font-display text-2xl italic text-accent">us</span>
      <MuteButton />
    </div>
  );
  const navRight = (
    <button
      type="button"
      onClick={() => setViewer(null)}
      aria-label="Promeni ko gleda"
      className="rounded-full p-1 outline-none transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Avatar person={viewer} size={32} />
    </button>
  );

  return (
    <>
      {/* key: each tab is its own screen with its own scroll position */}
      <LargeTitleScreen
        key={tab}
        eyebrow={tab === "vremeplov" ? "Na današnji dan" : undefined}
        title={tab === "vremeplov" ? formatDayKey(today) : "Fun fact"}
        navLeft={navLeft}
        navRight={navRight}
        bottomInset={TAB_BAR_INSET}
      >
        {!byYear || !stats ? (
          <p className="mt-10 text-center text-muted">Učitavam…</p>
        ) : tab === "vremeplov" ? (
          byYear.size === 0 ? (
            <p className="mt-16 text-center text-[15px] text-muted">Ovog dana se nismo dopisivali.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[...byYear].map(([year, list], i) => (
                <YearCard
                  key={year}
                  year={year}
                  count={list.length}
                  index={i}
                  tint={tints?.get(year) ?? 0}
                  search={search}
                />
              ))}
            </div>
          )
        ) : (
          <StatsPanel stats={stats} viewer={viewer} />
        )}

        {search && (
          <Link href="/pocetna" className="mt-8 block text-center text-xs text-muted underline">
            test datum aktivan ({search}) · vrati na danas
          </Link>
        )}
      </LargeTitleScreen>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />
    </>
  );
}
