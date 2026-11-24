PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS internships (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('Remote', 'Hybrid', 'On-site')),
    location TEXT NOT NULL DEFAULT 'Remote',
    duration_weeks INTEGER NOT NULL DEFAULT 4 CHECK (duration_weeks > 0),
    skills TEXT NOT NULL DEFAULT '[]',
    openings INTEGER NOT NULL DEFAULT 1 CHECK (openings >= 0),
    applications_open INTEGER NOT NULL DEFAULT 1 CHECK (applications_open IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internship_id TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (internship_id, applicant_email),
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
);
