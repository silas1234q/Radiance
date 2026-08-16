import 'dotenv/config';
import app from "./app";
import { startJobs } from "./jobs";
import { startKeepAlive } from "./jobs/keepAlive";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Scheduled push jobs (weekly summary + win-back). Opt out with DISABLE_JOBS=1
  // in environments where a single worker shouldn't run crons.
  if (process.env.DISABLE_JOBS !== '1') startJobs();
  // Not gated behind DISABLE_JOBS — a worker that shouldn't send push still
  // needs to stay awake. No-ops unless a public URL is configured.
  startKeepAlive();
});
