"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { parseDayKey, todayKey } from "./day";
import { loadDay, loadStats } from "./messages";
import type { Stats } from "./stats";
import type { Message, Person } from "./types";

const VIEWER_KEY = "us:viewer";
const VIEWER_EVENT = "us:viewer-change";

function readViewer(): Person | null {
  try {
    const v = localStorage.getItem(VIEWER_KEY);
    return v === "on" || v === "ona" ? v : null;
  } catch {
    return null;
  }
}

function subscribeViewer(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(VIEWER_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(VIEWER_EVENT, onChange);
  };
}

export function setViewer(viewer: Person | null) {
  try {
    if (viewer) localStorage.setItem(VIEWER_KEY, viewer);
    else localStorage.removeItem(VIEWER_KEY);
  } catch {
    // Storage unavailable (private mode etc.): the choice just won't persist.
  }
  window.dispatchEvent(new Event(VIEWER_EVENT));
}

/** Who is looking: `undefined` while not yet known (prerender), `null` if not chosen. */
export function useViewer(): Person | null | undefined {
  return useSyncExternalStore(subscribeViewer, readViewer, () => undefined);
}

const noopSubscribe = () => () => {};

/**
 * Today's "MM-DD" key (day starts at 06:00 Belgrade time), or `null` during prerender.
 * `?datum=MM-DD` in the URL overrides it for testing.
 */
export function useToday(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const override = new URLSearchParams(window.location.search).get("datum");
      return override && parseDayKey(override) ? override : todayKey();
    },
    () => null,
  );
}

/** `?datum=MM-DD` if the test override is active, so links can carry it along. */
export function useSearch(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const datum = new URLSearchParams(window.location.search).get("datum");
      return datum && parseDayKey(datum) ? `?datum=${datum}` : "";
    },
    () => "",
  );
}

/** Whole-history stats; `null` while loading. */
export function useStats(): Stats | null {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    let active = true;
    loadStats().then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, []);
  return stats;
}

/** Our messages on an "MM-DD" day, by year; `null` while loading. */
export function useDay(key: string | null): Map<number, Message[]> | null {
  const [day, setDay] = useState<{ key: string; byYear: Map<number, Message[]> } | null>(null);
  useEffect(() => {
    if (!key) return;
    let active = true;
    loadDay(key).then((byYear) => {
      if (active) setDay({ key, byYear });
    });
    return () => {
      active = false;
    };
  }, [key]);
  return day && day.key === key ? day.byYear : null;
}
