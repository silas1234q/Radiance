import 'dotenv/config';
import app from "./app";
import { startJobs } from "./jobs";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Scheduled push jobs (weekly summary + win-back). Opt out with DISABLE_JOBS=1
  // in environments where a single worker shouldn't run crons.
  if (process.env.DISABLE_JOBS !== '1') startJobs();
});
