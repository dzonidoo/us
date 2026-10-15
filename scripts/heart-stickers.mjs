// Stickers that show a heart, so sending one counts as sending a heart.
// Stickers are images in the exports, with no text to search, so this list was
// made by looking at every sticker we sent (2026-10-15). Keys are the sticker's
// file name without extension.

export const HEART_STICKERS = new Set([
  // Facebook export (stickers_used/<id>.png)
  "126362100881920", // heart eyes
  "383649078463198",
  "396449313832508",
  "1573846502838534",
  "396449193832520",
  "340529338546284", // "I ♥ U"
  "178518209293200",
  "1573846616171856",
  "396449220499184",
  "396449427165830",
  "396449390499167",
  "396449263832513",
  "396449127165860",
  "396449380499168",
  "396449133832526",
  "144885035685763",
  "1598371140426188",
  "383649338463172",
  "383649255129847",
  "383649145129858",
  "383649095129863",
  "383649288463177",
  "383649241796515",
  "383649381796501",
  "1435020546788902",
  "1435020103455613",
  "1435019323455691",
  "1435019863455637",
  "1435021223455501",
  "1435019743455649",
  "1435018290122461",
  "1435018460122444",
  "1435019480122342",
  "1435018730122417",
  "1435019936788963",
  "1064722216889245",
  "1064722293555904",
  // Messenger secure storage export (media/<uuid>.webp)
  "ae70814d-f76a-4fc9-9cc8-2160398395ae", // avatar making a heart
]);

/** Whether an exported sticker/attachment path is one of the heart stickers. */
export const isHeartSticker = (uri) => HEART_STICKERS.has(uri.split("/").pop().replace(/\.\w+$/, ""));
