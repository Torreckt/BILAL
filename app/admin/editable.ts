import { notFound } from "next/navigation";
import { isUuid } from "@/lib/validate";

/** For editor pages at /admin/<kind>/[id]: "new" gives undefined (an empty form); any other id must name an existing row. */
export async function loadEditable<T>(id: string, load: (id: string) => Promise<T | undefined>) {
  if (id === "new") return undefined;
  if (!isUuid(id)) notFound();
  const row = await load(id);
  if (!row) notFound();
  return row;
}
