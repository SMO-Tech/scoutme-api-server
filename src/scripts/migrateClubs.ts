import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// New database (smo_dev) - where we're migrating TO
const connectionString = process.env.DATABASE_URL;
console.log('Connecting to new database (smo_dev)...');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Old database (smo_v2) - where we're migrating FROM
// Replace the database name in the connection string
const oldDbConnectionString = connectionString?.replace('/smo_dev', '/smo_v2');
console.log('Connecting to old database (smo_v2)...');
const oldPool = new Pool({ connectionString: oldDbConnectionString });

// S3 URL prefix for images
const S3_PREFIX = 'https://smo-operation.s3.eu-west-2.amazonaws.com/';

// Test mode - set to specific group_id to test, or null to run all
const TEST_CLUB_ID: number | null = null; // Set to a group_id to test single club

// Stats
const stats = {
  total: 0,
  created: 0,
  skippedDuplicate: 0,
  skippedNoData: 0,
  errors: 0
};

async function main() {
  console.log('\n========================================');
  console.log('   MIGRATE CLUBS FROM OLD PLATFORM');
  console.log('========================================\n');

  // Query old clubs table (adjust schema name if needed)
  // If smo_v2 is a different database, you may need to set up a foreign data wrapper
  // or use a separate connection
  
  type OldClub = {
    group_id: number;
    user_id: number | null;
    club_title: string | null;
    description: string | null;
    approval: number | null;
    photo_id: number | null;
    creation_date: Date | null;
    modified_date: Date | null;
    member_count: number | null;
    view_count: number | null;
    country: string | null;
  };

  let oldClubs: OldClub[];
  
  if (TEST_CLUB_ID) {
    console.log(`🧪 TEST MODE: Migrating club with group_id = ${TEST_CLUB_ID}\n`);
    const result = await oldPool.query('SELECT * FROM clubs WHERE group_id = $1', [TEST_CLUB_ID]);
    oldClubs = result.rows;
  } else {
    console.log('📊 Fetching all clubs from old platform...\n');
    const result = await oldPool.query('SELECT * FROM clubs ORDER BY group_id');
    oldClubs = result.rows;
  }

  stats.total = oldClubs.length;
  console.log(`📊 Total old clubs: ${stats.total}\n`);

  if (oldClubs.length === 0) {
    console.log('No clubs found in old platform.');
    return;
  }

  // Get all photo_ids for batch image lookup
  const photoIds = oldClubs
    .filter(c => c.photo_id)
    .map(c => c.photo_id as number);

  console.log(`🔍 Fetching images for ${photoIds.length} clubs...\n`);

  // Query media_files for club logos
  type MediaFile = { parent_id: number; type: string; storage_path: string };
  let mediaFiles: MediaFile[] = [];
  
  if (photoIds.length > 0) {
    mediaFiles = await prisma.$queryRaw<MediaFile[]>(
      Prisma.sql`
        SELECT parent_id, type, storage_path 
        FROM media_files 
        WHERE parent_id = ANY(${photoIds})
        AND parent_type = 'group'
        AND type IN ('thumb', 'thumb.profile', 'thumb.normal', 'thumb.icon')
      `
    ).catch(() => []);
  }

  console.log(`📁 Found ${mediaFiles.length} media files\n`);

  // Create a map: photo_id -> { thumb, thumb.profile, etc. }
  const mediaMap = new Map<number, Record<string, string>>();
  
  for (const media of mediaFiles) {
    if (!mediaMap.has(media.parent_id)) {
      mediaMap.set(media.parent_id, {});
    }
    mediaMap.get(media.parent_id)![media.type] = S3_PREFIX + media.storage_path;
  }

  console.log('Processing clubs...');
  console.log('----------------------------------------');

  for (const oldClub of oldClubs) {
    const clubTitle = oldClub.club_title?.trim();
    const country = oldClub.country?.trim() || 'Unknown';

    if (!clubTitle) {
      stats.skippedNoData++;
      console.log(`  ⏭️  [${oldClub.group_id}] Skipped - no club title`);
      continue;
    }

    try {
      // Check if club already exists
      const existing = await prisma.club.findFirst({
        where: {
          name: clubTitle,
          country: country
        }
      });

      if (existing) {
        // Update with legacy data if not already set
        if (!existing.clubId) {
          const images = oldClub.photo_id ? mediaMap.get(oldClub.photo_id) || {} : {};
          
          await prisma.club.update({
            where: { id: existing.id },
            data: {
              clubId: oldClub.group_id,
              description: oldClub.description || existing.description,
              memberCount: oldClub.member_count,
              viewCount: oldClub.view_count,
              modifiedAt: oldClub.modified_date,
              thumbUrl: images['thumb'] || null,
              thumbProfileUrl: images['thumb.profile'] || null,
              thumbNormalUrl: images['thumb.normal'] || null,
              thumbIconUrl: images['thumb.icon'] || null
            }
          });
          stats.created++;
          console.log(`  ✅ [${oldClub.group_id}] Updated: ${clubTitle}`);
        } else {
          stats.skippedDuplicate++;
          console.log(`  ⏭️  [${oldClub.group_id}] Already migrated: ${clubTitle}`);
        }
        continue;
      }

      // Get images for this club
      const images = oldClub.photo_id ? mediaMap.get(oldClub.photo_id) || {} : {};

      // Create new club
      const newClub = await prisma.club.create({
        data: {
          name: clubTitle,
          country: country,
          clubId: oldClub.group_id,
          description: oldClub.description,
          memberCount: oldClub.member_count,
          viewCount: oldClub.view_count,
          modifiedAt: oldClub.modified_date,
          createdAt: oldClub.creation_date || new Date(),
          thumbUrl: images['thumb'] || null,
          thumbProfileUrl: images['thumb.profile'] || null,
          thumbNormalUrl: images['thumb.normal'] || null,
          thumbIconUrl: images['thumb.icon'] || null,
          status: 'UNCLAIMED'
        }
      });

      stats.created++;
      console.log(`  ✅ [${oldClub.group_id}] Created: ${clubTitle} -> ${newClub.id}`);

    } catch (error: any) {
      stats.errors++;
      console.log(`  ❌ [${oldClub.group_id}] Error: ${error.message?.substring(0, 80)}`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('   MIGRATION SUMMARY');
  console.log('========================================');
  console.log(`📊 Total old clubs:      ${stats.total}`);
  console.log(`✅ Created/Updated:      ${stats.created}`);
  console.log(`⏭️  Skipped (duplicate):  ${stats.skippedDuplicate}`);
  console.log(`⏭️  Skipped (no data):    ${stats.skippedNoData}`);
  console.log(`❌ Errors:               ${stats.errors}`);
  console.log('========================================\n');

  // Verification
  const clubCount = await prisma.club.count();
  const withClubId = await prisma.club.count({ where: { clubId: { not: null } } });

  console.log(`🔍 Total clubs in database: ${clubCount}`);
  console.log(`🔍 Clubs with legacy clubId: ${withClubId}`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    await oldPool.end();
  });

