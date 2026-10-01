const router = require('express').Router();
const db = require('../db/db');
const { HttpError, parseId, wrap } = require('../middleware/errors');

function validate(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!name) throw new HttpError(400, 'Project name is required.');
  if (name.length > 100) throw new HttpError(400, 'Project name must be 100 characters or fewer.');
  if (description.length > 500) throw new HttpError(400, 'Description must be 500 characters or fewer.');
  return { name, description: description || null };
}

const SELECT = `SELECT p.id, p.name, p.description, p.created_at AS createdAt,
  COALESCE(SUM(e.duration_seconds), 0) AS totalSeconds
  FROM projects p LEFT JOIN time_entries e ON e.project_id = p.id AND e.end_time IS NOT NULL`;

router.get('/', wrap(async (req, res) => {
  res.json(await db.all(`${SELECT} GROUP BY p.id ORDER BY p.created_at DESC, p.id DESC`));
}));

router.post('/', wrap(async (req, res) => {
  const { name, description } = validate(req.body || {});
  const { lastID } = await db.run('INSERT INTO projects (name, description) VALUES (?, ?)', [name, description]);
  res.status(201).json(await db.get(`${SELECT} WHERE p.id = ? GROUP BY p.id`, [lastID]));
}));

router.put('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { name, description } = validate(req.body || {});
  const { changes } = await db.run(
    `UPDATE projects SET name = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
    [name, description, id]
  );
  if (!changes) throw new HttpError(404, 'Project not found.');
  res.json(await db.get(`${SELECT} WHERE p.id = ? GROUP BY p.id`, [id]));
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { changes } = await db.run('DELETE FROM projects WHERE id = ?', [id]);
  if (!changes) throw new HttpError(404, 'Project not found.');
  res.status(204).end();
}));

module.exports = router;
