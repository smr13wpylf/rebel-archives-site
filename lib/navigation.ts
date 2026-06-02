/**
 * Primary navigation. Used by both Header and Footer.
 * Order here is the order rendered in the header.
 */
export type NavItem = {
  label: string;
  href: string;
};

export const mainNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Writing", href: "/writing" },
  { label: "Work With Me", href: "/work-with-me" },
  { label: "Offerings", href: "/offerings" },
  { label: "Subscribe", href: "/subscribe" },
  { label: "Contact", href: "/contact" },
];

// Grouped links for the footer.
export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Read",
    items: [
      { label: "The Journal", href: "/writing" },
      { label: "Subscribe", href: "/subscribe" },
    ],
  },
  {
    heading: "Work",
    items: [
      { label: "Work With Me", href: "/work-with-me" },
      { label: "Offerings", href: "/offerings" },
    ],
  },
  {
    heading: "Studio",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];
