const router = require('express').Router();
const db = require('../db/db');
const { HttpError, wrap } = require('../middleware/errors');

const RUNNING = `SELECT e.id, e.project_id AS projectId, p.name AS projectName, e.start_time AS startTime
  FROM time_entries e JOIN projects p ON p.id = e.project_id WHERE e.end_time IS NULL`;

router.get('/', wrap(async (req, res) => {
  res.json((await db.get(RUNNING)) || null);
}));

router.post('/start', wrap(async (req, res) => {
  const projectId = Number((req.body || {}).projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) throw new HttpError(400, 'Choose a project first.');
  if (!(await db.get('SELECT id FROM projects WHERE id = ?', [projectId]))) {
    throw new HttpError(404, 'Project not found.');
  }
  if (await db.get(RUNNING)) throw new HttpError(409, 'A timer is already running.');
  try {
    await db.run('INSERT INTO time_entries (project_id, start_time) VALUES (?, ?)', [projectId, new Date().toISOString()]);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') throw new HttpError(409, 'A timer is already running.');
    throw e;
  }
  res.status(201).json(await db.get(RUNNING));
}));

router.post('/stop', wrap(async (req, res) => {
  const running = await db.get(RUNNING);
  if (!running) throw new HttpError(409, 'No timer is running.');
  const end = new Date();
  const duration = Math.max(1, Math.round((end - new Date(running.startTime)) / 1000));
  await db.run('UPDATE time_entries SET end_time = ?, duration_seconds = ? WHERE id = ? AND end_time IS NULL', [
    end.toISOString(), duration, running.id,
  ]);
  res.json({
    id: running.id, projectId: running.projectId, projectName: running.projectName,
    startTime: running.startTime, endTime: end.toISOString(), durationSeconds: duration,
  });
}));

module.exports = router;
