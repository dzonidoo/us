"use client";

import { setViewer } from "@/lib/hooks";
import { PEOPLE } from "@/lib/people";
import { Avatar } from "./app-ui";

/**
 * "Who's looking?" Shown in place by HomeScreen while nobody is picked: no page
 * change, so nothing reloads and the music keeps playing.
 */
export function ViewerPicker() {
  return (
    <main className="pt-safe pb-safe flex h-full flex-col items-center justify-center px-6">
      <h1 className="rise font-display text-7xl italic leading-none text-accent">us</h1>
      <p className="rise mt-3 text-[15px] text-muted [animation-delay:80ms]">naše poruke, na današnji dan</p>

      <div className="mt-16 flex gap-8">
        {(["on", "ona"] as const).map((person, i) => (
          <button
            key={person}
            type="button"
            onClick={() => setViewer(person)}
            aria-label={PEOPLE[person].name}
            style={{ animationDelay: `${240 + i * 80}ms` }}
            className="rise flex flex-col items-center gap-2.5 rounded-full outline-none transition-transform duration-150 active:scale-90 focus-visible:[&>span:first-child]:ring-4 focus-visible:[&>span:first-child]:ring-accent"
          >
            <Avatar person={person} size={112} />
          </button>
        ))}
      </div>
    </main>
  );
}
