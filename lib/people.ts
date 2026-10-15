import { asset } from "./base-path";
import type { Person } from "./types";

// Display names and avatars (384px WebP in public/avatars).
// `avatarFit` frames each memoji in its circle; they sit differently in their images.
export const PEOPLE: Record<Person, { name: string; avatar: string; avatarFit: string }> = {
  on: { name: "On", avatar: asset("/avatars/on.webp"), avatarFit: "translate-y-[1%]" },
  ona: { name: "Ona", avatar: asset("/avatars/ona.webp"), avatarFit: "translate-y-[6%] scale-110" },
};

export function other(person: Person): Person {
  return person === "on" ? "ona" : "on";
}
