import { redirect } from "next/navigation";
import { storedKey } from "@/lib/access";

/** Old /g/<slug> links: open the strongest link this browser holds. */
export default async function LegacyLedger({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${(await storedKey(slug)) ?? slug}`);
}
