// scripts/ingestDay.ts
import 'dotenv/config';
import { ingestDay } from '../ingest';

// Get YYYY-MM-DD in SAST (Africa/Johannesburg)
function localDateSAST(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  return fmt.format(new Date());
}

// Inputs come from env (set by the workflow)
// DATE (optional), LEAGUES (optional, comma list), DEFAULT_LEAGUES (fallback)
const date = process.env.DATE && process.env.DATE.trim().length > 0
  ? process.env.DATE
  : localDateSAST();

const leaguesCsv = (process.env.LEAGUES && process.env.LEAGUES.trim().length > 0)
  ? process.env.LEAGUES
  : (process.env.DEFAULT_LEAGUES || 'eng.1');

const leagues = leaguesCsv.split(',').map(s => s.trim()).filter(Boolean);

console.log('🕒 Running ingest', { date, leagues });

ingestDay({ date, leagues })
  .then(r => { console.log('✅ Ingest complete', r); process.exit(0); })
  .catch(e => { console.error('❌ Ingest failed', e); process.exit(1); });
