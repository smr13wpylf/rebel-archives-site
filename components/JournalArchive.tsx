"use client";

import { useState } from "react";
import type { PostMeta } from "@/lib/posts";
import { EditorialCard } from "./EditorialCard";
import { cn } from "@/lib/cn";

/**
 * Client-side category filter over the journal archive. Posts are passed
 * in pre-sorted from the server; filtering is purely presentational so the
 * page stays static and fast.
 */
export function JournalArchive({
  posts,
  categories,
}: {
  posts: PostMeta[];
  categories: string[];
}) {
  const [active, setActive] = useState<string>("All");
  const filters = ["All", ...categories];
  const visible = active === "All" ? posts : posts.filter((p) => p.category === active);

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {filters.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              aria-pressed={isActive}
              className={cn(
                "rounded-full border px-4 py-2 font-sans text-micro uppercase tracking-label transition-colors duration-300",
                isActive
                  ? "border-ink bg-ink text-bone"
                  : "border-line text-taupe hover:border-ink hover:text-ink",
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="mt-12 divide-y divide-line border-t border-line">
        {visible.map((post) => (
          <EditorialCard key={post.slug} post={post} variant="compact" />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-12 text-body text-taupe">Nothing here yet. Soon.</p>
      )}
    </div>
  );
}
