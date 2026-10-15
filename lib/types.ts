export type Person = "on" | "ona";

export type Message = {
  /** Unix timestamp in milliseconds. */
  ts: number;
  sender: Person;
  text: string;
};
