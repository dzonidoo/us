import { belgradeTime } from "./day";
import type { Message, Person } from "./types";

// Placeholder data until the real Facebook export is in.
// Hours >= 24 are past midnight (next calendar day) and must still land on
// the same logical day; 06:30 is the first moment of a new day.

type Line = [hour: number, minute: number, sender: Person, text: string];

const CONVERSATIONS: Line[][] = [
  [
    [6, 30, "on", "Dobro jutro, sunce ☀️"],
    [7, 12, "ona", "Jutrooo 😴 tek sam ustala"],
    [9, 45, "on", "Kafa posle posla?"],
    [9, 47, "ona", "Može! U 17h kod parka?"],
    [13, 20, "ona", "Šta jedeš za ručak?"],
    [13, 22, "on", "Ćevape, naravno 😄"],
    [22, 10, "ona", "Hvala za danas ❤️"],
    [23, 40, "on", "Hvala tebi, bilo je savršeno"],
    [24, 35, "ona", "Ne mogu da zaspim 🙈"],
    [25, 15, "on", "Ni ja. Laku noć, ljubim te ❤️"],
  ],
  [
    [8, 5, "ona", "Jesi stigao na posao?"],
    [8, 9, "on", "Jesam, gužva užasna 🚗"],
    [11, 30, "on", "Vidi ovo 😂😂"],
    [11, 31, "ona", "Hahaha ne mogu 😂"],
    [16, 0, "ona", "Šta radimo večeras?"],
    [16, 4, "on", "Film i pica? 🍕"],
    [16, 5, "ona", "Najbolji si ❤️"],
    [21, 50, "on", "Koji film biraš?"],
    [21, 52, "ona", "Nešto romantično, ti biraš sledeći put 😇"],
    [24, 20, "on", "Zaspala si na pola filma 😄 laku noć ❤️"],
  ],
  [
    [7, 40, "on", "Srećno danas na ispitu! 🍀"],
    [7, 42, "ona", "Hvala ljubavi, strašno se plašim 😬"],
    [12, 15, "ona", "POLOŽILA SAM!!! 🎉🎉"],
    [12, 16, "on", "Znaaao sam! Ponosan sam na tebe ❤️❤️"],
    [12, 18, "ona", "Moramo da proslavimo"],
    [12, 20, "on", "Večeras večera, ja častim 🥂"],
    [19, 30, "ona", "Spremam se, kasnim 10 min 🙈"],
    [19, 31, "on", "Čekam te, ne žuri"],
    [23, 55, "ona", "Najlepše veče ❤️"],
    [26, 5, "on", "Slažem se. Volim te ❤️"],
  ],
  [
    [9, 0, "ona", "Pada kiša ☔ ostajem u krevetu"],
    [9, 3, "on", "Zavidim ti 😅"],
    [10, 30, "on", "Šta ćemo za vikend?"],
    [10, 34, "ona", "Možda Zlatibor? 🏔️"],
    [10, 35, "on", "Odlična ideja!"],
    [15, 10, "ona", "Našla sam super smeštaj, šaljem link"],
    [15, 25, "on", "Rezervisano ✅"],
    [15, 26, "ona", "Jeeej ❤️"],
    [20, 45, "on", "Pakuješ se već? 😄"],
    [24, 50, "ona", "Naravno, kofer je spreman 🧳 laku noć ❤️"],
  ],
];

// Which years have a conversation on which day (month 10 = October).
const SCHEDULE: { day: number; years: number[] }[] = [
  { day: 15, years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { day: 16, years: [2021, 2023, 2024] },
  { day: 17, years: [2022, 2023] },
];

function build(): Message[] {
  const messages: Message[] = [];
  let i = 0;
  for (const { day, years } of SCHEDULE) {
    for (const year of years) {
      const lines = CONVERSATIONS[i++ % CONVERSATIONS.length];
      for (const [hour, minute, sender, text] of lines) {
        messages.push({ ts: belgradeTime(year, 10, day, hour, minute), sender, text });
      }
    }
  }
  return messages.sort((a, b) => a.ts - b.ts);
}

export const MOCK_MESSAGES: Message[] = build();
