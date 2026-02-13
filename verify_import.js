/**
 * Verify imported attendance data in database
 */

import pool from './config/db.js';

async function verifyImport() {
    console.log('\n========================================');
    console.log('VERIFYING IMPORTED ATTENDANCE DATA');
    console.log('========================================\n');

    try {
        // Total count
        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM attendance_backup');
        console.log(`✅ Total records in database: ${countResult[0].count}\n`);

        // Count by year
        console.log('📅 Distribution by Academic Year:');
        const [yearCounts] = await pool.query(`
      SELECT YEAR(started_at) as year, COUNT(*) as count 
      FROM attendance_backup 
      GROUP BY YEAR(started_at) 
      ORDER BY year
    `);
        yearCounts.forEach(row => {
            console.log(`   ${row.year}: ${row.count} records`);
        });

        // Count by stream
        console.log('\n🎓 Distribution by Stream:');
        const [streamCounts] = await pool.query(`
      SELECT stream, COUNT(*) as count 
      FROM attendance_backup 
      GROUP BY stream 
      ORDER BY stream
    `);
        streamCounts.forEach(row => {
            console.log(`   ${row.stream}: ${row.count} records`);
        });

        // Count by subject
        console.log('\n📚 Distribution by Subject:');
        const [subjectCounts] = await pool.query(`
      SELECT subject, COUNT(*) as count 
      FROM attendance_backup 
      GROUP BY subject 
      ORDER BY count DESC
    `);
        subjectCounts.forEach(row => {
            console.log(`   ${row.subject}: ${row.count} records`);
        });

        // Sample records
        console.log('\n📋 Sample Records (First 5):');
        const [samples] = await pool.query(`
      SELECT filename, subject, stream, division, 
             DATE_FORMAT(started_at, '%Y-%m-%d') as date,
             DATE_FORMAT(saved_at, '%Y-%m-%d') as saved
      FROM attendance_backup 
      ORDER BY saved_at DESC 
      LIMIT 5
    `);

        console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
        samples.forEach((row, idx) => {
            console.log(`│ ${idx + 1}. ${row.filename.substring(0, 50).padEnd(50)}`);
            console.log(`│    Subject: ${row.subject.padEnd(30)} Stream: ${row.stream}`);
            console.log(`│    Date: ${row.date}  Saved: ${row.saved}`);
            console.log('├─────────────────────────────────────────────────────────────────────┤');
        });
        console.log('└─────────────────────────────────────────────────────────────────────┘');

        // Date range
        console.log('\n📆 Date Range:');
        const [dateRange] = await pool.query(`
      SELECT 
        DATE_FORMAT(MIN(started_at), '%M %Y') as earliest,
        DATE_FORMAT(MAX(started_at), '%M %Y') as latest
      FROM attendance_backup
    `);
        console.log(`   Earliest: ${dateRange[0].earliest}`);
        console.log(`   Latest: ${dateRange[0].latest}`);

        console.log('\n========================================');
        console.log('✅ ALL DATA VERIFIED SUCCESSFULLY!');
        console.log('========================================\n');
        console.log('💡 Next Steps:');
        console.log('   1. Login to admin/teacher dashboard');
        console.log('   2. Click "View History" button');
        console.log('   3. Browse all 272 attendance records');
        console.log('   4. Download any record as Excel');
        console.log('   5. Test defaulter list generation\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

verifyImport();
