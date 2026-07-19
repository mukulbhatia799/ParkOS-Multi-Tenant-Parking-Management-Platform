import { createApp } from "./app";
import { connectDb } from "./db";
import { config } from "./config";
import { getProducer } from "./kafka/producer";
import { startConsumer } from "./kafka/consumer";

async function main() {
  await connectDb();
  await getProducer();
  await startConsumer();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[pricing-billing-service] listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("[pricing-billing-service] fatal startup error", err);
  process.exit(1);
});
