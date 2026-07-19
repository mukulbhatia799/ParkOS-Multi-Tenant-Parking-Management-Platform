import { createApp } from "./app";
import { connectDb } from "./db";
import { config } from "./config";
import { getProducer } from "./kafka/producer";
import { startConsumer } from "./kafka/consumer";

async function main() {
  await connectDb();
  await getProducer();

  startConsumer().catch((err) => {
    console.error("[vehicle-records-service] kafka consumer failed to start", err);
  });

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[vehicle-records-service] listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("[vehicle-records-service] fatal startup error", err);
  process.exit(1);
});
