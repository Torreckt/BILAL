// Draft previews: an owner or editor can see unpublished content by adding ?preview=1 to a public page.
import { getSession } from "./auth";
import { CONTENT_ROLES } from "./roles";

/** True when the URL asks for a preview and the visitor is a signed-in owner or editor. */
export async function wantsPreview(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  if ((await searchParams).preview !== "1") return false;
  const user = await getSession();
  return !!user && CONTENT_ROLES.includes(user.role);
}
