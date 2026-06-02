/**
 * Tiny classnames helper. Filters falsy values and joins with spaces.
 * Avoids pulling in a dependency for such a small need.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
