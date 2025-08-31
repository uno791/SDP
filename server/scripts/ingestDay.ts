import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { ingestDay } from "../ingest";

const today = new Date().toISOString().slice(0, 10);
const leagues = (process.env.DEFAULT_LEAGUES || "eng.1").split(",");

ingestDay({ date: today, leagues })
  .then((r) => {
    console.log("✅ Ingest complete", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Ingest failed", e);
    process.exit(1);
  });
