export type Person = "on" | "ona";

export type Message = {
  /** Unix timestamp in milliseconds. */
  ts: number;
  sender: Person;
  text: string;
  /** An attachment. Only photos are shown; `src: null` means it isn't available. */
  media?: {
    kind: MediaKind;
    src?: string | null;
    /** A sticker showing a heart: counts as a sent heart. */
    heart?: boolean;
  };
};

export type MediaKind = "photo" | "video" | "gif" | "audio" | "sticker";
