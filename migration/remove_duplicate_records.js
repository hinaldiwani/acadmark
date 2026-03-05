import pool from "../config/db.js";

async function removeDuplicates() {
    const connection = await pool.getConnection();

    try {
        console.log("🔍 Finding and removing duplicate attendance records...\n");

        // Find duplicates
        const [duplicates] = await connection.query(
            `SELECT session_id, student_id, COUNT(*) as count
             FROM attendance_records
             GROUP BY session_id, student_id
             HAVING COUNT(*) > 1`
        );

        console.log(`Found ${duplicates.length} duplicate session-student combinations\n`);

        if (duplicates.length === 0) {
            console.log("✅ No duplicates found!");
            process.exit(0);
        }

        // For each duplicate, keep only the record with the lowest ID (oldest)
        let deleted = 0;
        for (const dup of duplicates) {
            // Get all records for this session-student combo
            const [records] = await connection.query(
                `SELECT id FROM attendance_records
                 WHERE session_id = ? AND student_id = ?
                 ORDER BY id ASC`,
                [dup.session_id, dup.student_id]
            );

            // Delete all except the first one
            if (records.length > 1) {
                const idsToDelete = records.slice(1).map(r => r.id);
                await connection.query(
                    `DELETE FROM attendance_records WHERE id IN (?)`,
                    [idsToDelete]
                );
                deleted += idsToDelete.length;
            }
        }

        console.log(`✅ Removed ${deleted} duplicate records\n`);

        // Verify
        const [remaining] = await connection.query(
            `SELECT session_id, student_id, COUNT(*) as count
             FROM attendance_records
             GROUP BY session_id, student_id
             HAVING COUNT(*) > 1`
        );

        if (remaining.length === 0) {
            console.log("✅ All duplicates have been removed successfully!");
        } else {
            console.log(`⚠️  Warning: ${remaining.length} duplicates still remain`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    } finally {
        connection.release();
        await pool.end();
    }
}

removeDuplicates();
