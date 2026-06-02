import { Container } from "@/components/Container";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[80vh] flex-col items-center justify-center py-section text-center">
      <p className="label mb-6">404 &mdash; Off the map</p>
      <h1 className="max-w-2xl text-display text-ink text-balance">
        This page is somewhere between intention and arrival.
      </h1>
      <p className="mt-6 max-w-md text-lede text-charcoal">
        The thing you were looking for has moved, been renamed, or never quite existed.
        Not every absence is a loss &mdash; but let&rsquo;s get you back to solid ground.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button href="/">Return home</Button>
        <Button href="/writing" variant="secondary">
          Read the Journal
        </Button>
      </div>
    </Container>
  );
}
