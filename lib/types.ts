export type Person = "on" | "ona";

export type Message = {
  /** Unix timestamp in milliseconds. */
  ts: number;
  sender: Person;
  text: string;
  /** An attachment. Only photos are shown; a photo with no `id` isn't available. */
  media?: {
    kind: MediaKind;
    /** Id of the (encrypted) photo in public/data/media/. */
    id?: string | null;
    /** A sticker showing a heart: counts as a sent heart. */
    heart?: boolean;
  };
};

export type MediaKind = "photo" | "video" | "gif" | "audio" | "sticker";
