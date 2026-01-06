/**
 * Script to safely add profile_visits table to database
 * 
 * Usage: npx ts-node src/scripts/add_profile_visits_table.ts
 */

import 'dotenv/config';
import { prisma } from '../utils/db';

async function addProfileVisitsTable() {
  try {
    console.log('🔧 Adding profile_visits table...\n');
    console.log('='.repeat(60));

    // Check if table already exists
    const checkTable = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'profile_visits'
    `;

    if (checkTable.length > 0) {
      console.log('✅ Table "profile_visits" already exists');
      return;
    }

    // Create the table
    console.log('📝 Creating profile_visits table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "profile_visits" (
        "id" TEXT NOT NULL,
        "visitedProfileId" TEXT NOT NULL,
        "visitorUserId" TEXT NOT NULL,
        "visitorProfileId" TEXT,
        "visitorProfileType" VARCHAR(50),
        "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "profile_visits_pkey" PRIMARY KEY ("id")
      )
    `;

    // Create indexes
    console.log('📝 Creating indexes...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "profile_visits_visitedProfileId_visitedAt_idx" 
      ON "profile_visits"("visitedProfileId", "visitedAt")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "profile_visits_visitorUserId_idx" 
      ON "profile_visits"("visitorUserId")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "profile_visits_visitedAt_idx" 
      ON "profile_visits"("visitedAt")
    `;

    // Add foreign keys (check if they exist first)
    console.log('📝 Adding foreign keys...');
    
    // Check and add visitedProfileId foreign key
    const fk1Exists = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'profile_visits' 
      AND constraint_name = 'profile_visits_visitedProfileId_fkey'
    `;
    
    if (fk1Exists.length === 0) {
      await prisma.$executeRaw`
        ALTER TABLE "profile_visits" 
        ADD CONSTRAINT "profile_visits_visitedProfileId_fkey" 
        FOREIGN KEY ("visitedProfileId") REFERENCES "player_profiles"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
      `;
    }

    // Check and add visitorUserId foreign key
    const fk2Exists = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'profile_visits' 
      AND constraint_name = 'profile_visits_visitorUserId_fkey'
    `;
    
    if (fk2Exists.length === 0) {
      await prisma.$executeRaw`
        ALTER TABLE "profile_visits" 
        ADD CONSTRAINT "profile_visits_visitorUserId_fkey" 
        FOREIGN KEY ("visitorUserId") REFERENCES "users"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
      `;
    }

    // Check and add visitorProfileId foreign key
    const fk3Exists = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'profile_visits' 
      AND constraint_name = 'profile_visits_visitorProfileId_fkey'
    `;
    
    if (fk3Exists.length === 0) {
      await prisma.$executeRaw`
        ALTER TABLE "profile_visits" 
        ADD CONSTRAINT "profile_visits_visitorProfileId_fkey" 
        FOREIGN KEY ("visitorProfileId") REFERENCES "player_profiles"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `;
    }

    console.log('✅ Successfully created profile_visits table with indexes and foreign keys');
    console.log('='.repeat(60));

    // Verify the table was created
    const verifyTable = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'profile_visits'
    `;

    if (verifyTable.length > 0) {
      console.log('\n✅ Verification: Table exists');
    } else {
      console.log('\n⚠️  Warning: Could not verify table was created');
    }

  } catch (error: any) {
    console.error('\n❌ Error creating table:', error.message);
    throw error;
  }
}

// Run the script
addProfileVisitsTable()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

