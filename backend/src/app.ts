import express from "express";
import cors from "cors";
import morgan from "morgan";
import { clerkAuth } from "./middleware/clerkAuth";
import routes from "./routes/routes";
import webhookRoutes from "./routes/webhookRoutes";
import { globalErrorHandler } from "./middleware/globalErrorHandler";

const app = express();

app.use(cors());
// Skip the keep-alive self-ping (see jobs/keepAlive.ts) — logging it would add
// ~4k lines/month of noise to Render's log retention.
app.use(morgan("dev", { skip: (req) => req.headers["user-agent"] === "radiance-keepalive" }));

// Webhook route must be before express.json() - needs raw body
app.use("/api/webhooks", webhookRoutes);

app.use(express.json({ limit: '20mb' }));
app.use(clerkAuth);

app.use("/api", routes);

app.use(globalErrorHandler);

export default app;