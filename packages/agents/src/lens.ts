import { LensClient } from "@anvia/lens";

let client: LensClient | undefined;

export function getLens(): LensClient {
  if (!client) {
    client = new LensClient({
      baseUrl: process.env.ANVIA_LENS_BASE_URL,
      publicKey: process.env.ANVIA_LENS_PUBLIC_KEY,
      secretKey: process.env.ANVIA_LENS_SECRET_KEY,
      serviceName: "finance-reimbursement-agent",
    });
  }
  return client;
}
