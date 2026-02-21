import pool from "./config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  try {
    console.log("🔍 Checking database tables...");

    // Check if tables exist
    const [tables] = await pool.query("SHOW TABLES");

    if (tables.length === 0) {
      console.log("📦 No tables found. Initializing database...");

      // Read and execute main SQL file
      const sqlFile = path.join(__dirname, "database_setup.sql");
      const sql = fs.readFileSync(sqlFile, "utf8");

      // Split by semicolon and execute each statement
      const statements = sql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        try {
          await pool.query(statement);
        } catch (err) {
          // Ignore duplicate errors
          if (!err.message.includes("already exists")) {
            console.error("Error executing statement:", err.message);
          }
        }
      }

      console.log("✅ Database initialized successfully!");
    } else {
      console.log(
        `✅ Database already initialized (${tables.length} tables found)`
      );
    }

    // Always run fix_missing_tables.sql to ensure all tables exist
    console.log("🔧 Checking for missing tables...");
    const fixFile = path.join(__dirname, "fix_missing_tables.sql");
    if (fs.existsSync(fixFile)) {
      const fixSql = fs.readFileSync(fixFile, "utf8");
      const fixStatements = fixSql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of fixStatements) {
        try {
          await pool.query(statement);
        } catch (err) {
          if (!err.message.includes("already exists")) {
            console.error("Error executing fix statement:", err.message);
          }
        }
      }
      console.log("✅ All tables verified and created if missing");
    }
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
    // Don't throw error - let the app start anyway
  }
}

// Run initialization
initializeDatabase().catch(console.error);

export default initializeDatabase;
