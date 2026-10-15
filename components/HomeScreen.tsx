"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dailyYearTints } from "@/lib/colors";
import { formatDayKey, logicalDay } from "@/lib/day";
import { setViewer, useMessages, useSearch, useToday } from "@/lib/hooks";
import { computeStats, messagesForDay } from "@/lib/messages";
import {
  Avatar,
  CalendarIcon,
  ChartIcon,
  LargeTitleScreen,
  TAB_BAR_INSET,
  TabBar,
  type TabItem,
} from "./app-ui";
import { StatsPanel } from "./StatsPanel";
import { useRequireViewer } from "./useRequireViewer";
import { YearCard } from "./YearCard";

type Tab = "godine" | "statistika";

const TABS: TabItem<Tab>[] = [
  { id: "godine", label: "Godine", icon: <CalendarIcon /> },
  { id: "statistika", label: "Statistika", icon: <ChartIcon /> },
];

export function HomeScreen() {
  const viewer = useRequireViewer();
  const today = useToday();
  const search = useSearch();
  const messages = useMessages();
  const [tab, setTab] = useState<Tab>("godine");

  const byYear = useMemo(
    () => (messages && today ? messagesForDay(messages, today) : null),
    [messages, today],
  );
  const stats = useMemo(() => (messages ? computeStats(messages) : null), [messages]);
  const [currentYear] = useState(() => logicalDay(Date.now()).year);
  // Reshuffled every day at 06:00 (when `today` changes), same on both phones.
  const tints = useMemo(
    () => (byYear && today ? dailyYearTints(`${currentYear}-${today}`, [...byYear.keys()]) : null),
    [byYear, today, currentYear],
  );

  if (!viewer || !today) return null;

  const navLeft = <span className="px-2 font-display text-2xl italic text-accent">us</span>;
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
        eyebrow={tab === "godine" ? "Na današnji dan" : undefined}
        title={tab === "godine" ? formatDayKey(today) : "Statistika"}
        navLeft={navLeft}
        navRight={navRight}
        bottomInset={TAB_BAR_INSET}
      >
        {!byYear || !stats ? (
          <p className="mt-10 text-center text-muted">Učitavam…</p>
        ) : tab === "godine" ? (
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
