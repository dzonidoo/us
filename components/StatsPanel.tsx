import type { ReactNode } from "react";
import { porukaLabel } from "@/lib/format";
import { DAY_PARTS, type DayPart, type Stats } from "@/lib/messages";
import { PEOPLE, other } from "@/lib/people";
import type { Person } from "@/lib/types";
import { Avatar } from "./app-ui";
import { DayPartIcon } from "./DayPartIcon";

const fmt = (n: number) => n.toLocaleString("sr-RS");

const COLOR: Record<Person, string> = { on: "var(--on)", ona: "var(--ona)" };

const PART_ORDER: DayPart[] = ["jutro", "dan", "vece", "noc"];

const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
const WEEKDAYS = ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"];

const HEART_PATH =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.2 0 3.7 1.3 5.2 3.2 1.5-1.9 3-3.2 5.2-3.2 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21Z";

/** Percentages for both people that add up to 100. */
function shares(values: Record<Person, number>): Record<Person, number> {
  const total = values.on + values.ona;
  const on = total ? Math.round((values.on / total) * 100) : 50;
  return { on, ona: 100 - on };
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[22px] bg-card p-4 shadow-[0_8px_24px_-18px_rgb(74_43_63/0.45)] ${className}`}>
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

/** Avatar ringed in the person's chart color, so it doubles as the legend. */
function PersonMark({ person, size }: { person: Person; size: number }) {
  return (
    <span className="inline-flex rounded-full p-1" style={{ background: COLOR[person] }}>
      <Avatar person={person} size={size} />
    </span>
  );
}

/** Avatar + percentage on each side; the viewer is always on the right. */
function Sides({ pct, viewer, size = 36 }: { pct: Record<Person, number>; viewer: Person; size?: number }) {
  return (
    <div className="flex items-center justify-between">
      {[other(viewer), viewer].map((p, i) => (
        <div key={p} className={`flex items-center gap-2.5 ${i ? "flex-row-reverse" : ""}`}>
          <PersonMark person={p} size={size} />
          <span className="font-display text-[32px] italic leading-none tabular-nums" aria-label={`${PEOPLE[p].name} ${pct[p]}%`}>
            {pct[p]}%
          </span>
        </div>
      ))}
    </div>
  );
}

function Compare({ values, viewer }: { values: Record<Person, number>; viewer: Person }) {
  const pct = shares(values);
  const left = other(viewer);
  return (
    <Card title="Ko više piše" className="col-span-2">
      <div className="mt-3">
        <Sides pct={pct} viewer={viewer} />
      </div>
      {/* 2px gap between the segments; colors follow the person. */}
      <div className="mt-4 flex h-2.5 gap-0.5" aria-hidden>
        <div className="rounded-full" style={{ width: `${pct[left]}%`, background: COLOR[left] }} />
        <div className="rounded-full" style={{ width: `${pct[viewer]}%`, background: COLOR[viewer] }} />
      </div>
    </Card>
  );
}

/** Ten hearts, colored by who sent them. */
function Hearts({ values, viewer }: { values: Record<Person, number>; viewer: Person }) {
  const pct = shares(values);
  const left = other(viewer);
  const leftHearts = Math.round(pct[left] / 10);
  return (
    <Card title="Ko šalje više srca" className="col-span-2">
      <div className="mt-3">
        <Sides pct={pct} viewer={viewer} />
      </div>
      <div className="mt-4 flex justify-between" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <svg key={i} viewBox="0 0 24 24" className="size-[26px]" style={{ color: COLOR[i < leftHearts ? left : viewer] }}>
            <path fill="currentColor" d={HEART_PATH} />
          </svg>
        ))}
      </div>
    </Card>
  );
}

function Starter({ values }: { values: Record<Person, number> }) {
  const pct = shares(values);
  const winner: Person = pct.on >= pct.ona ? "on" : "ona";
  return (
    <Card title="Ko prvi piše">
      <div className="mt-5 flex flex-col items-center text-center">
        <div className="relative">
          <PersonMark person={winner} size={56} />
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl" aria-hidden>
            👑
          </span>
        </div>
        <div className="mt-3 font-display text-[30px] italic leading-none tabular-nums">{pct[winner]}%</div>
        <div className="mt-1.5 text-[12px] text-muted">započne razgovor</div>
      </div>
    </Card>
  );
}

function RecordDay({ day }: { day: NonNullable<Stats["busiestDay"]> }) {
  const weekday = WEEKDAYS[new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay()];
  return (
    <Card title="Rekordan dan">
      <div className="mt-4 flex flex-col items-center text-center">
        {/* Tear-off calendar page */}
        <div className="w-16 overflow-hidden rounded-xl bg-background ring-1 ring-border">
          <div className="bg-accent py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {MONTHS_SHORT[day.month - 1]}
          </div>
          <div className="font-display text-[28px] italic leading-[1.15]">{day.day}</div>
          <div className="pb-1 text-[10px] text-muted">{day.year}</div>
        </div>
        <div className="mt-2.5 text-[15px] font-semibold">{porukaLabel(day.count)}</div>
        <div className="text-[12px] text-muted">{weekday}</div>
      </div>
    </Card>
  );
}

function DayParts({ parts, busiest }: { parts: Record<DayPart, number>; busiest: DayPart }) {
  const total = PART_ORDER.reduce((s, p) => s + parts[p], 0) || 1;
  return (
    <Card title="Najaktivniji deo dana" className="col-span-2">
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {PART_ORDER.map((p) => {
          const top = p === busiest;
          return (
            <div
              key={p}
              className={`flex flex-col items-center rounded-2xl py-3 ${top ? "bg-accent-soft text-accent" : "text-muted"}`}
            >
              <DayPartIcon part={p} />
              <div className={`mt-2 text-[13px] font-semibold ${top ? "" : "text-foreground"}`}>
                {DAY_PARTS[p].label}
              </div>
              <div className="text-[10px]">{DAY_PARTS[p].hours}</div>
              <div className={`mt-2 font-display text-[22px] italic leading-none tabular-nums ${top ? "" : "text-foreground"}`}>
                {Math.round((parts[p] / total) * 100)}%
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function StatsPanel({ stats, viewer }: { stats: Stats; viewer: Person }) {
  return (
    <div className="rise grid grid-cols-2 gap-3">
      <section className="col-span-2 rounded-[22px] bg-[linear-gradient(135deg,var(--tint-1),var(--tint-2)_60%,var(--tint-3))] p-5">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted">Ukupno</h2>
        <div className="mt-3 grid grid-cols-2 text-center">
          <div>
            <div className="font-display text-[44px] italic leading-none tabular-nums">{fmt(stats.total)}</div>
            <div className="mt-2 text-[13px] text-muted">poruka</div>
          </div>
          <div>
            <div className="font-display text-[44px] italic leading-none tabular-nums">{fmt(stats.totalHearts)}</div>
            <svg viewBox="0 0 24 24" className="mx-auto mt-2 size-[18px] text-accent" role="img" aria-label="srca">
              <path fill="currentColor" d={HEART_PATH} />
            </svg>
          </div>
        </div>
      </section>

      <Compare values={stats.messages} viewer={viewer} />
      <Hearts values={stats.hearts} viewer={viewer} />
      <Starter values={stats.conversationsStarted} />
      {stats.busiestDay && <RecordDay day={stats.busiestDay} />}
      {stats.busiestPart && <DayParts parts={stats.dayParts} busiest={stats.busiestPart.part} />}
    </div>
  );
}
