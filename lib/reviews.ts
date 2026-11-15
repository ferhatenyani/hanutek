import type { Product } from "./products";

export type Review = {
  id: string;
  author: string;
  city: string;
  rating: number;
  daysAgo: number;
};

/** Mock voices for a FR/MA customer base. Bodies live in messages/reviews. */
export const reviews: Review[] = [
  { id: "r1", author: "Youssef El Amrani", city: "Casablanca", rating: 5, daysAgo: 6 },
  { id: "r2", author: "Camille Delaunay", city: "Lyon", rating: 4, daysAgo: 19 },
  { id: "r3", author: "Nadia Ouazzani", city: "Tanger", rating: 5, daysAgo: 33 },
  { id: "r4", author: "Thomas Ferrand", city: "Rennes", rating: 4, daysAgo: 47 },
  { id: "r5", author: "Sofia Marchetti", city: "Lille", rating: 5, daysAgo: 61 },
  { id: "r6", author: "Karim Benali", city: "Madrid", rating: 3, daysAgo: 88 },
];

const seedOf = (product: Product) => Number(product.id.replace(/\D/g, "")) || 1;

/** Two to three reviews per SKU, rotated so no two products look identical. */
export const reviewsFor = (product: Product): Review[] => {
  const seed = seedOf(product);
  const start = seed % reviews.length;
  const take = 2 + (seed % 2);
  return Array.from({ length: take }, (_, i) => reviews[(start + i) % reviews.length]);
};

/**
 * Star histogram that actually averages to the product rating, so the summary
 * and the headline number never contradict each other.
 */
export const ratingBreakdown = (rating: number, count: number) => {
  const five = Math.max(0.34, Math.min(0.92, (rating - 3) / 2));
  const four = (1 - five) * 0.58;
  const three = (1 - five - four) * 0.62;
  const two = (1 - five - four - three) * 0.55;
  const shares = [five, four, three, two].map((value) => Math.round(value * count));
  const one = Math.max(0, count - shares.reduce((sum, value) => sum + value, 0));
  // Ordered stars 5 down to 1.
  return [shares[0], shares[1], shares[2], shares[3], one];
};
