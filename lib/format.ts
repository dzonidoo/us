/** "1 poruka", "3 poruke", "12 poruka", "22 poruke". */
export function porukaLabel(n: number): string {
  const last = n % 10;
  const lastTwo = n % 100;
  const word = last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "poruke" : "poruka";
  return `${n.toLocaleString("sr-RS")} ${word}`;
}
