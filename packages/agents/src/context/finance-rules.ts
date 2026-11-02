import type { Document } from "@anvia/core";

export const financeRuleDocuments: readonly Document[] = [
  {
    id: "rule-meterai",
    text: `Under the Indonesian stamp duty law (UU 10/2020), payment documents with a value above Rp5,000,000 are generally subject to stamp duty of Rp10,000 (electronic or physical e-meterai).`,
    additionalProps: { source: "finance-rule", topic: "documents" },
  },
  {
    id: "rule-reimbursement-tax",
    text: `In general, reimbursement of actual business expenses backed by proof is not treated as employee income, while fixed allowances paid regardless of actual spending can be treated as taxable income (PPh 21). Tax treatment depends on the case, so confirm with the tax team.`,
    additionalProps: { source: "finance-rule", topic: "tax" },
  },
];
