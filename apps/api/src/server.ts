import { createApp } from './app';
import { getDatabase, runMigrations } from './database';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function main() {
  const db = getDatabase();
  await runMigrations(db);

  const { app } = createApp(db);

  app.listen(PORT, () => {
    console.log(`Open Agents API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
