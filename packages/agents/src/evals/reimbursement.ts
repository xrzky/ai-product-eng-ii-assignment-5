import {
  answerRelevancy,
  contains,
  gEval,
  runEvalCli,
} from "@anvia/core/evals";
import { getModel } from "../models";
import { runAgent } from "../agent";
import { getLens } from "../lens";

const model = getModel();

const cases = [
  {
    id: "rb-01-meal-limit",
    input: "Berapa batas reimbursement makan per hari?",
    expected: "Rp150,000 per day.",
    metadata: { pattern: "150" },
  },
  {
    id: "rb-02-deadline",
    input: "How many days do I have to submit a reimbursement claim?",
    expected: "Within 30 calendar days after the expense date.",
    metadata: { pattern: "\\b30\\b" },
  },
  {
    id: "rb-03-approval",
    input: "Klaim saya Rp3.000.000, siapa yang harus menyetujui?",
    expected: "The direct manager and the Finance Head.",
    metadata: { pattern: "Finance Head|Kepala Keuangan" },
  },
  {
    id: "rb-04-over-limit-meal",
    input:
      "I spent Rp200,000 on lunch during a business trip. Can I claim the full amount?",
    expected:
      "No. The meal limit is Rp150,000 per day, so only Rp150,000 is reimbursable and Rp50,000 is not.",
    metadata: { pattern: "150" },
  },
  {
    id: "rb-05-hotel",
    input: "Berapa batas biaya hotel per malam untuk dinas dalam negeri?",
    expected: "Rp800,000 per night.",
    metadata: { pattern: "800" },
  },
  {
    id: "rb-06-receipt",
    input:
      "Struk makan siang saya hilang, apakah klaim saya masih bisa diproses?",
    expected:
      "No. Every claim needs a receipt or invoice showing date, vendor, and amount. A claim without a receipt is rejected.",
    metadata: { pattern: "struk|receipt|bukti|invoice" },
  },
  {
    id: "rb-07-payment-time",
    input: "How long after approval is the reimbursement paid?",
    expected: "Within 7 working days after final approval.",
    metadata: { pattern: "\\b7\\b" },
  },
  {
    id: "rb-08-late-claim",
    input:
      "Saya makan Rp100.000 di perjalanan dinas 45 hari yang lalu. Masih bisa diklaim?",
    expected:
      "No. Claims must be submitted within 30 calendar days, so a 45-day-old expense is past the deadline unless the Finance Head approves an exception.",
    metadata: { pattern: "\\b30\\b" },
  },
];

await runEvalCli({
  name: "reimbursement",
  cases,
  concurrency: 2,
  caseTimeoutMs: 180_000,
  target: (input: string) =>
    runAgent({ messages: [{ role: "user", content: input }] }).text,
  reporters: [getLens().evalReporter({ includePayloads: true })],
  metrics: [
    gEval({
      name: "correctness",
      model,
      evaluationParams: ["input", "actualOutput", "expectedOutput"],
      criteria:
        "Judge whether the actual output gives the same key facts and numbers as the expected output. Ignore wording and language differences (Indonesian or English). A wrong or missing number is a failure.",
      rubric: [
        {
          scoreRange: [0, 3],
          expectedOutcome: "Wrong, or the key number or fact is missing.",
        },
        {
          scoreRange: [4, 6],
          expectedOutcome:
            "Right topic, but the key number is incomplete or unclear.",
        },
        {
          scoreRange: [7, 10],
          expectedOutcome:
            "Gives the same key number and fact as the expected output.",
        },
      ],
      threshold: 0.7,
    }),

    answerRelevancy({
      name: "answer_relevancy",
      model,
      threshold: 0.7,
    }),

    contains({
      name: "contains_numbers",
      expected: (args) => new RegExp(String(args.case.metadata?.pattern), "i"),
    }),
  ],
});

await getLens().flush();
