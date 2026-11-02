import { runAgent } from "./agent";
import { getLens } from "./lens";

const text = await runAgent({
  messages: [
    {
      role: "user",
      content:
        "Gua makan siang Rp200.000 waktu dinas luar kota kemarin. Bisa direimburse penuh?",
    },
  ],
}).text;

console.log(text);

// Short-lived process: send queued telemetry to Lens before exiting.
await getLens().flush();
