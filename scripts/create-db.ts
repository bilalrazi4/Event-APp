import * as dotenv from 'dotenv';
import pgPromise from 'pg-promise';

dotenv.config();

const pgp = pgPromise();

async function bootstrapDatabase() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  // Connect to the default 'postgres' database first to check/create our target DB
  const db = pgp({
    host: DB_HOST,
    port: parseInt(DB_PORT || '5432', 10),
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres',
  });

  try {
    // Check if the database already exists
    const result = await db.any('SELECT datname FROM pg_database WHERE datname = $1', [DB_NAME]);
    
    if (result.length === 0) {
      console.log(`🚀 Database "${DB_NAME}" does not exist. Creating it now...`);
      await db.none(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Database "${DB_NAME}" created successfully.`);
    } else {
      console.log(`✅ Database "${DB_NAME}" already exists.`);
    }
  } catch (error) {
    console.error('❌ Error checking/creating database:', error);
    process.exit(1);
  } finally {
    pgp.end(); 
  }
}

bootstrapDatabase();
