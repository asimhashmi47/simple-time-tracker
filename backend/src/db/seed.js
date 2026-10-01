// Seeds sample projects and 100 completed time entries. Usage: npm run seed
const db = require('./db');

const PROJECTS = [
  ['Website Redesign', 'Marketing site refresh for a retail client'],
  ['Mobile App', 'Cross-platform fitness tracking app'],
  ['Client Portal', 'Invoices and file sharing for customers'],
  ['Brand Identity', 'Logo, palette and style guide'],
  ['SEO Audit', 'Technical and content audit'],
  ['API Integration', 'Payment gateway and CRM sync'],
  ['Newsletter', null],
  ['Admin Dashboard', 'Internal analytics and reporting'],
];
const ENTRIES = 100;

async function main() {
  await db.init();
  const ids = [];
  for (const [name, description] of PROJECTS) {
    ids.push((await db.run('INSERT INTO projects (name, description) VALUES (?, ?)', [name, description])).lastID);
  }

  const now = Date.now();
  const DAY = 86400000;
  for (let i = 0; i < ENTRIES; i++) {
    // Spread across the last 30 days, working hours 8:00-18:00, 10 min to 3 h long, never in the future.
    const day = new Date(now - Math.floor(Math.random() * 30) * DAY);
    day.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
    const duration = (10 + Math.floor(Math.random() * 171)) * 60;
    let start = day.getTime();
    if (start + duration * 1000 > now) start = now - duration * 1000 - 60000;
    const startIso = new Date(start).toISOString();
    const endIso = new Date(start + duration * 1000).toISOString();
    await db.run(
      'INSERT INTO time_entries (project_id, start_time, end_time, duration_seconds, created_at) VALUES (?, ?, ?, ?, ?)',
      [ids[Math.floor(Math.random() * ids.length)], startIso, endIso, duration, endIso]
    );
  }
  console.log(`Seeded ${PROJECTS.length} projects and ${ENTRIES} time entries.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
