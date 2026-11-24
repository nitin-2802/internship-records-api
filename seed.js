import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedFile = path.join(__dirname, 'seed-data.json');
const { internships } = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));

const insert = db.prepare(`
  INSERT OR REPLACE INTO internships
    (id, title, domain, mode, location, duration_weeks, skills, openings, applications_open)
  VALUES
    (@id, @title, @domain, @mode, @location, @duration_weeks, @skills, @openings, @applications_open)
`);

const seedAll = db.transaction((records) => {
  for (const item of records) {
    insert.run({
      ...item,
      skills: JSON.stringify(item.skills ?? []),
      applications_open: item.applications_open ? 1 : 0,
    });
  }
});

seedAll(internships);
console.log(`Seeded ${internships.length} internship records into SQLite.`);
