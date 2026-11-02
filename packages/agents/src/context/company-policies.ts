import type { Document } from "@anvia/core";

export const companyPolicyDocuments: readonly Document[] = [
  {
    id: "fin-company-profile",
    text: `PT Nusantara Teknologi Mandiri is a fictional company used for this prototype. Reimbursement claims are submitted by employees in the Finance portal and reviewed by the Finance team.`,
    additionalProps: { source: "company-policy", topic: "profile" },
  },
  {
    id: "fin-eligible-expenses",
    text: `Eligible expenses: meals during business trips outside the home city, transport for business purposes, accommodation during business trips, and communication costs for work. Not eligible: personal expenses, traffic fines, alcohol, and gifts without prior written approval.`,
    additionalProps: { source: "company-policy", topic: "eligibility" },
  },
  {
    id: "fin-limits",
    text: `Reimbursement limits per category: meals Rp150,000 per day; transport (taxi or online ride) Rp250,000 per trip; accommodation Rp800,000 per night for domestic trips; communication Rp200,000 per month. The amount above a limit is not reimbursed unless the Finance Head approves an exception in writing.`,
    additionalProps: { source: "company-policy", topic: "limits" },
  },
  {
    id: "fin-receipts",
    text: `Every claim needs a receipt or invoice (paper or electronic) that shows the date, vendor name, and amount. A claim without a receipt is rejected.`,
    additionalProps: { source: "company-policy", topic: "documents" },
  },
  {
    id: "fin-deadline",
    text: `Claims must be submitted within 30 calendar days after the expense date. Claims submitted later are rejected unless the Finance Head approves an exception.`,
    additionalProps: { source: "company-policy", topic: "deadline" },
  },
  {
    id: "fin-approval",
    text: `Approval depends on the total claim amount: up to Rp1,000,000 needs the direct manager; above Rp1,000,000 up to Rp5,000,000 needs the direct manager and the Finance Head; above Rp5,000,000 also needs a Director.`,
    additionalProps: { source: "company-policy", topic: "approval" },
  },
  {
    id: "fin-payment",
    text: `After final approval, payment is made within 7 working days to the employee's bank account registered in the payroll system. Finance never asks for bank details in chat.`,
    additionalProps: { source: "company-policy", topic: "payment" },
  },
];
