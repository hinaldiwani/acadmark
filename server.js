import dotenv from "dotenv";
import app from "./src/app.js";
import pool from "./config/db.js";
import initializeDatabase from "./init-db.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to MySQL database");

    // Initialize database tables if they don't exist
    await initializeDatabase();

    const server = app.listen(PORT, () => {
      console.log(`🚀 AcadMark server running at http://localhost:${PORT}`);
    });

    // Handle port in use error
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`   Try stopping the other process or use a different port:`);
        console.error(`   PORT=3002 node server.js`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Unable to connect to MySQL database:", error.message);
    process.exit(1);
  }
}

startServer();