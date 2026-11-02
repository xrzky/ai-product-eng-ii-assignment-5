import { createTool } from "@anvia/core";
import { z } from "zod";
import {
  approvalLevelFor,
  CATEGORIES,
  CLAIM_DEADLINE_DAYS,
  LIMITS,
} from "../policy-limit";

export const checkReimbursementLimitTool = createTool({
  name: "check_reimbursement_limit",
  description:
    "Check one expense against the reimbursement policy. Give the category, the amount in IDR for ONE unit (per day for meal, per trip for transport, per night for accommodation, per month for communication), and how many days ago the expense happened. Returns whether it is within the limit, the reimbursable amount, the deadline status, and who must approve.",
  inputSchema: z.object({
    category: z.enum(CATEGORIES),
    amount: z.number().int().positive(),
    daysSinceExpense: z.number().int().min(0).default(0),
  }),
  execute: async ({ category, amount, daysSinceExpense }) => {
    const { limit, unit } = LIMITS[category];
    const reimbursable = Math.min(amount, limit);

    return {
      category,
      limit,
      limitUnit: unit,
      claimedAmount: amount,
      withinLimit: amount <= limit,
      reimbursableAmount: reimbursable,
      excessAmount: Math.max(0, amount - limit),
      withinDeadline: daysSinceExpense <= CLAIM_DEADLINE_DAYS,
      deadlineDays: CLAIM_DEADLINE_DAYS,
      approvalLevel: approvalLevelFor(reimbursable),
    };
  },
});
