import type { ReactNode } from "react";
import { porukaLabel } from "@/lib/format";
import { belgradeParts } from "@/lib/day";
import { DAY_PARTS, type DayCount, type DayPart, type Stats } from "@/lib/stats";
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

function Card({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  /** Shown before the title, e.g. the avatar of who it's about. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[22px] bg-card p-4 shadow-[0_8px_24px_-18px_rgb(74_43_63/0.45)] ${className}`}>
      <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Avatar ringed in the person's chart color, so it doubles as the legend. */
function PersonMark({ person, size, muted = false }: { person: Person; size: number; muted?: boolean }) {
  return (
    <span className="inline-flex rounded-full p-1" style={{ background: muted ? "var(--muted)" : COLOR[person] }}>
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

/** Half card: whoever has more of something, with their share. */
function Winner({ title, values, caption }: { title: string; values: Record<Person, number>; caption: string }) {
  const pct = shares(values);
  // Decide on the raw counts: rounded shares can tie (50% / 50%) when one is ahead.
  const winner: Person = values.on >= values.ona ? "on" : "ona";
  return (
    <Card title={title}>
      <div className="mt-5 flex flex-col items-center text-center">
        <div className="relative">
          <PersonMark person={winner} size={56} />
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl" aria-hidden>
            👑
          </span>
        </div>
        <div className="mt-3 font-display text-[30px] italic leading-none tabular-nums">{pct[winner]}%</div>
        <div className="mt-1.5 text-[12px] text-muted">{caption}</div>
      </div>
    </Card>
  );
}

/**
 * Half card for a near tie: both of us side by side, the leader first and in
 * their color, the other in grey. Exact shares (two decimals), since whole
 * percents would round both to 50%.
 */
function CloseCall({ title, values, caption }: { title: string; values: Record<Person, number>; caption: string }) {
  const total = values.on + values.ona;
  const first: Person = values.on >= values.ona ? "on" : "ona";
  const order = [first, other(first)];
  const leads = values[first] > values[order[1]];
  const pct = (p: Person) =>
    `${(total ? (values[p] / total) * 100 : 50).toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  return (
    <Card title={title}>
      {/* One grid so the avatars share a row and the percents share a baseline. */}
      <div className="mt-5 grid grid-cols-2 items-baseline justify-items-center gap-x-2 gap-y-2.5">
        {order.map((p, i) => (
          <div key={p} className="relative">
            <PersonMark person={p} size={44} muted={!(i === 0 && leads)} />
            {i === 0 && leads && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg" aria-hidden>
                👑
              </span>
            )}
          </div>
        ))}
        {order.map((p, i) => {
          const highlighted = i === 0 && leads;
          return (
            <div
              key={p}
              className={`font-display italic leading-none tabular-nums ${highlighted ? "text-[20px]" : "text-[15px]"}`}
              style={{ color: highlighted ? COLOR[p] : "var(--muted)" }}
            >
              {pct(p)}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center text-[12px] text-muted">{caption}</div>
    </Card>
  );
}

/** Tear-off calendar page. */
function CalendarLeaf({ day }: { day: DayCount }) {
  return (
    <div className="w-16 shrink-0 overflow-hidden rounded-xl bg-background text-center ring-1 ring-border">
      <div className="bg-accent py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
        {MONTHS_SHORT[day.month - 1]}
      </div>
      <div className="font-display text-[28px] italic leading-[1.15]">{day.day}</div>
      <div className="pb-1 text-[10px] text-muted">{day.year}</div>
    </div>
  );
}

function weekdayOf(day: DayCount) {
  return WEEKDAYS[new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay()];
}

/** A notable day: calendar page, a count under it, and the weekday. */
function DayCard({ title, day, label, className = "" }: { title: string; day: DayCount; label: string; className?: string }) {
  return (
    <Card title={title} className={className}>
      <div className="mt-4 flex flex-col items-center text-center">
        <CalendarLeaf day={day} />
        <div className="mt-2.5 text-[15px] font-semibold">{label}</div>
        <div className="text-[12px] text-muted">{weekdayOf(day)}</div>
      </div>
    </Card>
  );
}

/** "1 put", "14 puta". */
const putaLabel = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "put" : "puta");

function Adore({ adore }: { adore: Stats["adore"] }) {
  const first = adore.first && belgradeParts(adore.first.ts);
  return (
    <Card
      title="Obožavam te"
      icon={adore.first && <PersonMark person={adore.first.sender} size={24} />}
      className="col-span-2"
    >
      <div className="mt-3 flex items-center">
        <div className="flex-1 text-center">
          <div className="font-display text-[44px] italic leading-none tabular-nums">{fmt(adore.count)}</div>
          <div className="mt-2 text-[13px] text-muted">{putaLabel(adore.count)} napisano</div>
        </div>
        {adore.first && first && (
          <>
            <div className="h-16 w-px bg-border" aria-hidden />
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="text-[15px] font-semibold">
                {first.day}. {MONTHS_SHORT[first.month - 1]} {first.year}.
              </div>
              <div className="text-[12px] text-muted">prvi put</div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function BootyCall({ calls }: { calls: Record<Person, number> }) {
  const total = calls.on + calls.ona;
  const caller: Person = calls.on >= calls.ona ? "on" : "ona";
  return (
    <Card title="Čuveni alarm · Booty call" icon={<PersonMark person={caller} size={24} />} className="col-span-2">
      <div className="mt-3 flex items-center justify-center gap-4">
        <span className="text-[44px] leading-none" aria-hidden>
          🚨
        </span>
        <div>
          <div className="font-display text-[44px] italic leading-none tabular-nums">{fmt(total)}</div>
          <div className="mt-1 text-[13px] text-muted">{putaLabel(total)} upotrebljen</div>
        </div>
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
        <div className="mt-4 flex items-stretch">
          <div className="flex flex-1 flex-col items-center">
            <div className="font-display text-[34px] italic leading-none tabular-nums">{fmt(stats.total)}</div>
            <div className="mt-2 text-[13px] text-muted">poruka</div>
          </div>
          <div className="w-px bg-foreground/10" aria-hidden />
          <div className="flex flex-1 flex-col items-center">
            <div className="font-display text-[34px] italic leading-none tabular-nums">{fmt(stats.totalHearts)}</div>
            <svg viewBox="0 0 24 24" className="mt-2 size-[18px] text-accent" role="img" aria-label="srca">
              <path fill="currentColor" d={HEART_PATH} />
            </svg>
          </div>
        </div>
      </section>

      <Compare values={stats.messages} viewer={viewer} />
      <Hearts values={stats.hearts} viewer={viewer} />
      <Winner title="Ko prvi piše" values={stats.firstOfDay} caption="dana prvi napiše" />
      {stats.busiestDay && (
        <DayCard title="Rekordan dan" day={stats.busiestDay} label={porukaLabel(stats.busiestDay.count)} />
      )}
      {stats.busiestPart && <DayParts parts={stats.dayParts} busiest={stats.busiestPart.part} />}
      {stats.happiestDay && (
        <DayCard
          title="Najsrećniji dan"
          day={stats.happiestDay}
          label={`${fmt(stats.happiestDay.count)} 😂 emojija`}
        />
      )}
      <CloseCall title="Veća pričalica" values={stats.words} caption="svih reči" />
      {stats.adore.count > 0 && <Adore adore={stats.adore} />}
      {stats.bootyCalls.on + stats.bootyCalls.ona > 0 && <BootyCall calls={stats.bootyCalls} />}
    </div>
  );
}
