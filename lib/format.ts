/** "poruka" or "poruke", agreeing with n: 1 poruka, 3 poruke, 12 poruka, 22 poruke. */
export function porukaWord(n: number): string {
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "poruke" : "poruka";
}

/** "1 poruka", "3 poruke", "12 poruka", "22 poruke". */
export function porukaLabel(n: number): string {
  return `${n.toLocaleString("sr-RS")} ${porukaWord(n)}`;
}
