const router = require('express').Router();
const db = require('../db/db');
const { HttpError, parseId, wrap } = require('../middleware/errors');

router.get('/', wrap(async (req, res) => {
  res.json(await db.all(`SELECT e.id, e.project_id AS projectId, p.name AS projectName,
    e.start_time AS startTime, e.end_time AS endTime, e.duration_seconds AS durationSeconds, e.created_at AS createdAt
    FROM time_entries e JOIN projects p ON p.id = e.project_id
    WHERE e.end_time IS NOT NULL ORDER BY e.start_time DESC LIMIT 500`));
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { changes } = await db.run('DELETE FROM time_entries WHERE id = ? AND end_time IS NOT NULL', [id]);
  if (!changes) throw new HttpError(404, 'Time entry not found.');
  res.status(204).end();
}));

module.exports = router;
