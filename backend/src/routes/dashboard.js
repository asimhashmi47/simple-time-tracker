const router = require('express').Router();
const db = require('../db/db');
const { wrap } = require('../middleware/errors');

router.get('/', wrap(async (req, res) => {
  // The client sends its local midnight (ISO) so "today" matches the user's timezone.
  const parsed = new Date(String(req.query.since || ''));
  const since = isNaN(parsed) ? new Date(new Date().setHours(0, 0, 0, 0)) : parsed;
  const [totals, projectCount, today, projects, recentEntries] = await Promise.all([
    db.get('SELECT COALESCE(SUM(duration_seconds), 0) AS s FROM time_entries WHERE end_time IS NOT NULL'),
    db.get('SELECT COUNT(*) AS c FROM projects'),
    db.get(
      'SELECT COALESCE(SUM(duration_seconds), 0) AS s FROM time_entries WHERE end_time IS NOT NULL AND start_time >= ?',
      [since.toISOString()]
    ),
    db.all(`SELECT p.id, p.name, COALESCE(SUM(e.duration_seconds), 0) AS totalSeconds
      FROM projects p LEFT JOIN time_entries e ON e.project_id = p.id AND e.end_time IS NOT NULL
      GROUP BY p.id ORDER BY totalSeconds DESC, p.name LIMIT 8`),
    db.all(`SELECT e.id, p.name AS projectName, e.start_time AS startTime, e.end_time AS endTime,
      e.duration_seconds AS durationSeconds FROM time_entries e JOIN projects p ON p.id = e.project_id
      WHERE e.end_time IS NOT NULL ORDER BY e.start_time DESC LIMIT 5`),
  ]);
  res.json({
    totalSeconds: totals.s, todaySeconds: today.s, projectCount: projectCount.c, projects, recentEntries,
  });
}));

module.exports = router;
