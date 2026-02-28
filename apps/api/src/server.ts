import { createApp } from './app';
import { getDatabase, runMigrations } from './database';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = getDatabase();
runMigrations(db);

const { app } = createApp(db);

app.listen(PORT, () => {
  console.log(`Open Agents API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
