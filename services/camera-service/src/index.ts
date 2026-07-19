import { createApp } from "./app";
import { connectDb } from "./db";
import { config } from "./config";
import { getProducer } from "./kafka/producer";

async function main() {
  await connectDb();
  await getProducer();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[camera-service] listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("[camera-service] fatal startup error", err);
  process.exit(1);
});
