import type { Document } from "@anvia/core";
import { companyPolicyDocuments } from "./company-policies";
import { financeRuleDocuments } from "./finance-rules";

export const staticContext: readonly Document[] = [
  ...companyPolicyDocuments,
  ...financeRuleDocuments,
];
