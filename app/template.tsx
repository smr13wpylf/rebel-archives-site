/**
 * A template re-mounts on every navigation, so the CSS enter animation
 * replays — giving a subtle page-level fade between routes. Reduced-motion
 * users get no animation (see .page-transition in globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
