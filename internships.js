import { Router } from 'express';
import db from '../db.js';
import {
  createInternshipSchema,
  updateInternshipSchema,
  listQuerySchema,
  formatZodError,
} from '../validation.js';

const router = Router();

function serializeInternship(row) {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain,
    mode: row.mode,
    location: row.location,
    duration_weeks: row.duration_weeks,
    skills: JSON.parse(row.skills || '[]'),
    openings: row.openings,
    applications_open: Boolean(row.applications_open),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// 1. LIST with pagination & optional filters
router.get('/', (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_QUERY',
        message: 'Invalid query parameters',
        details: formatZodError(parsed.error),
      },
    });
  }

  const { page, limit, mode, domain, open } = parsed.data;
  const conditions = [];
  const params = {};

  if (mode) {
    conditions.push('mode = @mode');
    params.mode = mode;
  }
  if (domain) {
    conditions.push('LOWER(domain) = LOWER(@domain)');
    params.domain = domain;
  }
  if (open !== undefined) {
    conditions.push('applications_open = @open');
    params.open = open;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS count FROM internships ${whereClause}`)
    .get(params);

  const rows = db
    .prepare(
      `SELECT * FROM internships ${whereClause} ORDER BY id ASC LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });

  const total = totalRow.count;
  const totalPages = Math.ceil(total / limit) || 1;

  return res.status(200).json({
    success: true,
    data: rows.map(serializeInternship),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

// 2. DETAIL
router.get('/:id', (req, res) => {
  const row = db
    .prepare('SELECT * FROM internships WHERE id = ?')
    .get(req.params.id);

  if (!row) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Internship '${req.params.id}' not found`,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: serializeInternship(row),
  });
});

// 3. CREATE
router.post('/', (req, res) => {
  const parsed = createInternshipSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid internship payload',
        details: formatZodError(parsed.error),
      },
    });
  }

  const data = parsed.data;

  try {
    db.prepare(
      `INSERT INTO internships
        (id, title, domain, mode, location, duration_weeks, skills, openings, applications_open)
       VALUES
        (@id, @title, @domain, @mode, @location, @duration_weeks, @skills, @openings, @applications_open)`
    ).run({
      ...data,
      skills: JSON.stringify(data.skills),
      applications_open: data.applications_open ? 1 : 0,
    });

    const created = db
      .prepare('SELECT * FROM internships WHERE id = ?')
      .get(data.id);

    return res.status(201).json({
      success: true,
      data: serializeInternship(created),
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ID',
          message: `Internship with id '${data.id}' already exists`,
        },
      });
    }
    throw err;
  }
});

// 4. UPDATE (supports both PATCH and PUT)
function handleUpdate(req, res) {
  const existing = db
    .prepare('SELECT * FROM internships WHERE id = ?')
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Internship '${req.params.id}' not found`,
      },
    });
  }

  const parsed = updateInternshipSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid update payload',
        details: formatZodError(parsed.error),
      },
    });
  }

  const updates = parsed.data;
  const setClauses = [];
  const params = { id: req.params.id };

  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = @${key}`);
    if (key === 'skills') {
      params[key] = JSON.stringify(value);
    } else if (key === 'applications_open') {
      params[key] = value ? 1 : 0;
    } else {
      params[key] = value;
    }
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');

  db.prepare(`UPDATE internships SET ${setClauses.join(', ')} WHERE id = @id`).run(
    params
  );

  const updated = db
    .prepare('SELECT * FROM internships WHERE id = ?')
    .get(req.params.id);

  return res.status(200).json({
    success: true,
    data: serializeInternship(updated),
  });
}

router.patch('/:id', handleUpdate);
router.put('/:id', handleUpdate);

// 5. DELETE
router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM internships WHERE id = ?')
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Internship '${req.params.id}' not found`,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: { id: req.params.id, deleted: true },
  });
});

export default router;
