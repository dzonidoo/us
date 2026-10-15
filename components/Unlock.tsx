"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import type { CryptoMeta } from "@/lib/crypto";
import { loadMeta, restore, unlock } from "@/lib/vault";

type State = { status: "checking" } | { status: "locked"; meta: CryptoMeta } | { status: "open" };

/**
 * Keeps the app behind the password. Opens straight away with a key
 * remembered on this device, or when there's no encrypted data (mock mode).
 */
export function Unlock({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    let active = true;
    (async () => {
      const meta = await loadMeta();
      const open = !meta || (await restore(meta));
      if (active) setState(open ? { status: "open" } : { status: "locked", meta: meta! });
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "open") return children;
  if (state.status === "checking") return null;
  return <PasswordScreen meta={state.meta} onUnlock={() => setState({ status: "open" })} />;
}

function PasswordScreen({ meta, onUnlock }: { meta: CryptoMeta; onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setWrong(false);
    if (await unlock(meta, password)) onUnlock();
    else {
      setWrong(true);
      setBusy(false);
    }
  };

  return (
    <main className="pt-safe pb-safe flex h-full flex-col items-center justify-center px-8">
      <h1 className="rise font-display text-7xl italic leading-none text-accent">us</h1>
      <p className="rise mt-3 text-[15px] text-muted [animation-delay:80ms]">naše poruke, na današnji dan</p>

      <form onSubmit={submit} className="rise mt-14 flex w-full max-w-xs flex-col gap-3 [animation-delay:160ms]">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lozinka"
          autoComplete="current-password"
          aria-invalid={wrong}
          className={`h-12 rounded-2xl border bg-card px-4 text-center text-[17px] outline-none transition-colors focus:border-accent ${
            wrong ? "border-accent" : "border-border"
          }`}
        />
        <button
          type="submit"
          disabled={!password || busy}
          className="h-12 rounded-2xl bg-accent text-[17px] font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-40"
        >
          {busy ? "Otključavam…" : "Otključaj"}
        </button>
        <p className={`h-5 text-center text-[13px] text-accent ${wrong ? "" : "invisible"}`} role="alert">
          Pogrešna lozinka
        </p>
      </form>
    </main>
  );
}
