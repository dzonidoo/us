/**
 * The site's path prefix ("/us" on GitHub Pages, "" locally). Next adds it to
 * links by itself; files from public/ (avatars, data) need it added by hand.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE_PATH}${path}`;
