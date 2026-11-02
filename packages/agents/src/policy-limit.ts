export const CATEGORIES = [
  "meal",
  "transport",
  "accommodation",
  "communication",
] as const;

export type ClaimCategory = (typeof CATEGORIES)[number];

export const LIMITS: Record<ClaimCategory, { limit: number; unit: string }> = {
  meal: { limit: 150_000, unit: "per day" },
  transport: { limit: 250_000, unit: "per trip" },
  accommodation: { limit: 800_000, unit: "per night" },
  communication: { limit: 200_000, unit: "per month" },
};

export const CLAIM_DEADLINE_DAYS = 30;

export function approvalLevelFor(totalAmount: number): string {
  if (totalAmount <= 1_000_000) return "direct manager";
  if (totalAmount <= 5_000_000) return "direct manager and Finance Head";
  return "direct manager, Finance Head and Director";
}
