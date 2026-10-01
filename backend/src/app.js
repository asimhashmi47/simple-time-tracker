const express = require('express');
const cors = require('cors');
const db = require('./db/db');
const { errorHandler } = require('./middleware/errors');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/projects', require('./routes/projects'));
app.use('/api/timer', require('./routes/timer'));
app.use('/api/time-entries', require('./routes/timeEntries'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }));
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
db.init().then(() => app.listen(port, () => console.log(`API listening on http://localhost:${port}`)));
