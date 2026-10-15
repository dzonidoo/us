"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useViewer } from "@/lib/hooks";

/** The viewer, sending them to the picker if they haven't chosen yet. */
export function useRequireViewer() {
  const router = useRouter();
  const viewer = useViewer();
  useEffect(() => {
    if (viewer === null) router.replace("/");
  }, [viewer, router]);
  return viewer ?? null;
}
