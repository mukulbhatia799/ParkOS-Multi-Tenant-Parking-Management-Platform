import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`[api-gateway] listening on port ${config.port}`);
});
