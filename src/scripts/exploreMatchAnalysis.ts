import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
// Connect to SMO_V1 database
const smoV1ConnectionString = connectionString?.replace(/\/[^/]+$/, '/smo_v1');
console.log('Connecting to SMO_V1 database...');
const smoV1Pool = new Pool({ connectionString: smoV1ConnectionString });

async function exploreTable(tableName: string) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Table: ${tableName}`);
    console.log('='.repeat(80));
    
    // Get table structure
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `;
    
    const structureResult = await smoV1Pool.query(structureQuery, [tableName]);
    
    console.log('\n📋 Table Structure:');
    console.log('-'.repeat(80));
    structureResult.rows.forEach((col: any) => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(30)} ${(col.data_type + length).padEnd(20)} ${nullable}${defaultVal}`);
    });
    
    // Get row count
    const countResult = await smoV1Pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    console.log(`\n📊 Total rows: ${countResult.rows[0].count}`);
    
    // Get sample data (5-7 rows)
    const sampleResult = await smoV1Pool.query(`SELECT * FROM ${tableName} LIMIT 7`);
    console.log(`\n📦 Sample Data (${sampleResult.rows.length} rows):`);
    console.log('-'.repeat(80));
    
    if (sampleResult.rows.length > 0) {
      // Print column headers
      const columns = Object.keys(sampleResult.rows[0]);
      console.log('Columns:', columns.join(', '));
      console.log('\n');
      
      // Print sample rows
      sampleResult.rows.forEach((row: any, index: number) => {
        console.log(`Row ${index + 1}:`);
        columns.forEach((col: string) => {
          const value = row[col];
          const displayValue = value === null ? 'NULL' : 
                              typeof value === 'object' ? JSON.stringify(value).substring(0, 100) :
                              String(value).substring(0, 100);
          console.log(`  ${col}: ${displayValue}`);
        });
        console.log('');
      });
    } else {
      console.log('  (No data found)');
    }
    
  } catch (error: any) {
    console.error(`❌ Error exploring ${tableName}:`, error.message);
  }
}

async function main() {
  console.log('\n========================================');
  console.log('   EXPLORING MATCH ANALYSIS TABLES');
  console.log('   Database: SMO_V1');
  console.log('========================================\n');

  const tables = [
    'engine4_event_events',
    'engine4_event_matchs',
    'engine4_event_details',
    'engine4_event_photos'
  ];

  for (const table of tables) {
    await exploreTable(table);
  }

  // Check for relationships/foreign keys
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔗 Checking Relationships/Foreign Keys');
  console.log('='.repeat(80));
  
  for (const table of tables) {
    try {
      const fkQuery = `
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
      `;
      
      const fkResult = await smoV1Pool.query(fkQuery, [table]);
      
      if (fkResult.rows.length > 0) {
        console.log(`\n${table}:`);
        fkResult.rows.forEach((fk: any) => {
          console.log(`  ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
    } catch (error: any) {
      console.error(`Error checking FKs for ${table}:`, error.message);
    }
  }

  await smoV1Pool.end();
  console.log('\n✅ Exploration complete!\n');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });

