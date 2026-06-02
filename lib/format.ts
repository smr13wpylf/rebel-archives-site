/**
 * Pure formatting helpers safe to import from client components.
 * Kept separate from lib/posts.ts so the filesystem code there never
 * leaks into the client bundle.
 */
export function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
