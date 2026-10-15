import Link from "next/link";
import { porukaLabel } from "@/lib/format";

type Props = {
  year: number;
  count: number;
  index: number;
  tint: number;
  search: string;
};

/** A year on today's date, as a home-screen-style widget tile. */
export function YearCard({ year, count, index, tint, search }: Props) {
  return (
    <Link
      href={`/godina/${year}${search}`}
      style={{ background: `var(--year-${tint})`, animationDelay: `${index * 60}ms` }}
      className="rise flex aspect-square flex-col justify-between rounded-[22px] p-4 outline-none transition-transform duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="text-[13px] font-medium text-muted">{porukaLabel(count)}</span>
      <span className="font-display text-[44px] italic leading-none">{year}</span>
    </Link>
  );
}
