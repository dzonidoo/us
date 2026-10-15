import { ChatView } from "@/components/ChatView";

// Messages are only readable in the browser (they'll be encrypted), so the
// years can't be known at build time: pre-render a page for every plausible one.
const FIRST_YEAR = 2008;
const LAST_YEAR = 2035;

export function generateStaticParams() {
  return Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => ({
    year: String(FIRST_YEAR + i),
  }));
}

export default async function GodinaPage({ params }: PageProps<"/godina/[year]">) {
  const { year } = await params;
  return <ChatView year={Number(year)} />;
}
