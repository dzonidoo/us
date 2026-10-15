"use client";

import { useEffect, useState } from "react";
import { photoUrl } from "@/lib/vault";

/** A photo that's stored encrypted: decrypted on the device, shown once ready. */
export function SecureImage({ id, className = "" }: { id: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    photoUrl(id).then(
      (url) => active && setSrc(url),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [id]);

  if (!src) {
    // Hold the space while decrypting, so the chat doesn't jump.
    return <div className={`${className} aspect-[4/3] ${failed ? "bg-border" : "animate-pulse bg-card"}`} aria-hidden />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} />;
}
