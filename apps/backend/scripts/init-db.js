import pg from 'pg';

/**
 * Ensures the application database exists in a shared PostgreSQL instance.
 * This script checks if DATABASE_SHARED_DEFAULT_DB_NAME is set
 * (indicating a shared DB instance).
 * If set and different from DATABASE_NAME, it:
 * 1. Connects to the shared database (DATABASE_SHARED_DEFAULT_DB_NAME)
 * 2. Checks if the target database (DATABASE_NAME) exists
 * 3. Creates it if it doesn't exist
 * For non-shared deployments, this script is a no-op.
 */
async function ensureDatabaseExists() {
  const sharedDbName = process.env.DATABASE_SHARED_DEFAULT_DB_NAME;
  const targetDbName = process.env.DATABASE_NAME;
  // If env vars not set, nothing to do (not a deployed environment)
  if (!targetDbName) return;
  // If no shared database, nothing to do
  if (!sharedDbName || sharedDbName === targetDbName) {
    console.log(`✅ Using dedicated database: ${targetDbName}`);
    return;
  }
  console.log(
    `🔄 Checking if database "${targetDbName}" exists in shared instance...`,
  );
  const client = new pg.Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: sharedDbName,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log(`✅ Connected to shared database: ${sharedDbName}`);
    // Check if target database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDbName],
    );
    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Created database: ${targetDbName}`);
    } else {
      console.log(`✅ Database already exists: ${targetDbName}`);
    }
  } catch (error) {
    console.error(`❌ Error ensuring database exists:`, error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

ensureDatabaseExists();
