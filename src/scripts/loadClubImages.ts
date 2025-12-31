import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to database...');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// S3 URL prefix for images
const S3_PREFIX = 'https://smo-operation.s3.eu-west-2.amazonaws.com/';

// Test mode - set to number of clubs to process (2 for testing, null for all)
const TEST_MODE_LIMIT: number | null = null;

// Stats
const stats = {
  total: 0,
  updated: 0,
  skippedNoClubId: 0,
  skippedNoImages: 0,
  ownerUpdated: 0,
  errors: 0
};

async function main() {
  console.log('\n========================================');
  console.log('   LOAD CLUB IMAGES FROM MEDIA_FILES');
  console.log('========================================\n');

  // Get clubs that have a clubId (legacy group_id) set
  const clubs = await prisma.club.findMany({
    where: {
      clubId: { not: null }
    },
    select: {
      id: true,
      name: true,
      country: true,
      clubId: true,
      logoUrl: true,
      thumbUrl: true,
      thumbProfileUrl: true,
      thumbNormalUrl: true,
      thumbIconUrl: true,
      ownerUserId: true
    },
    take: TEST_MODE_LIMIT || undefined,
    orderBy: {
      createdAt: 'asc'
    }
  });

  stats.total = clubs.length;
  console.log(`📊 Found ${clubs.length} clubs with clubId set\n`);

  if (clubs.length === 0) {
    console.log('No clubs found with clubId set.');
    return;
  }

  console.log('Processing clubs...');
  console.log('----------------------------------------');

  for (const club of clubs) {
    if (!club.clubId) {
      stats.skippedNoClubId++;
      console.log(`  ⏭️  [${club.id}] Skipped - no clubId`);
      continue;
    }

    try {
      // Query media_files for this club
      // parent_type = 'group' and parent_id = clubId
      type MediaFile = { 
        type: string | null; 
        storage_path: string | null;
        user_id: number | null;
      };

      const mediaFiles = await prisma.$queryRaw<MediaFile[]>(
        Prisma.sql`
          SELECT type, storage_path, user_id 
          FROM media_files 
          WHERE parent_type = 'group'
          AND parent_id = ${club.clubId}
          AND storage_path IS NOT NULL
        `
      );

      if (mediaFiles.length === 0) {
        stats.skippedNoImages++;
        console.log(`  ⏭️  [${club.clubId}] ${club.name} - No images found`);
        continue;
      }

      // Map images by type
      let logoUrl = club.logoUrl;
      let thumbProfileUrl = club.thumbProfileUrl;
      let thumbNormalUrl = club.thumbNormalUrl;
      let thumbIconUrl = club.thumbIconUrl;

      // Get user_id from media_files (use first non-null user_id found)
      let ownerUserId = club.ownerUserId;
      const userIdFromMedia = mediaFiles.find(m => m.user_id !== null)?.user_id;

      if (userIdFromMedia && !ownerUserId) {
        // Find User where player_id = user_id from media_files
        const user = await prisma.user.findUnique({
          where: { player_id: userIdFromMedia },
          select: { id: true }
        });

        if (user) {
          ownerUserId = user.id;
          stats.ownerUpdated++;
        }
      }

      for (const media of mediaFiles) {
        if (!media.storage_path) continue;

        const imageUrl = S3_PREFIX + media.storage_path;

        // NULL type means original photo -> logoUrl
        if (media.type === null || media.type === '') {
          logoUrl = imageUrl;
        } else if (media.type === 'thumb.profile') {
          thumbProfileUrl = imageUrl;
        } else if (media.type === 'thumb.normal') {
          thumbNormalUrl = imageUrl;
        } else if (media.type === 'thumb.icon') {
          thumbIconUrl = imageUrl;
        }
      }

      // Update club with image URLs and owner
      await prisma.club.update({
        where: { id: club.id },
        data: {
          logoUrl: logoUrl || club.logoUrl,
          thumbProfileUrl: thumbProfileUrl || club.thumbProfileUrl,
          thumbNormalUrl: thumbNormalUrl || club.thumbNormalUrl,
          thumbIconUrl: thumbIconUrl || club.thumbIconUrl,
          ownerUserId: ownerUserId || club.ownerUserId
        }
      });

      stats.updated++;
      console.log(`  ✅ [${club.clubId}] ${club.name} (${club.country})`);
      console.log(`     Images found: ${mediaFiles.length}`);
      if (logoUrl && logoUrl !== club.logoUrl) console.log(`     - logoUrl: ${logoUrl}`);
      if (thumbProfileUrl && thumbProfileUrl !== club.thumbProfileUrl) console.log(`     - thumbProfileUrl: ${thumbProfileUrl}`);
      if (thumbNormalUrl && thumbNormalUrl !== club.thumbNormalUrl) console.log(`     - thumbNormalUrl: ${thumbNormalUrl}`);
      if (thumbIconUrl && thumbIconUrl !== club.thumbIconUrl) console.log(`     - thumbIconUrl: ${thumbIconUrl}`);
      if (ownerUserId && ownerUserId !== club.ownerUserId) console.log(`     - ownerUserId: ${ownerUserId} (from user_id: ${userIdFromMedia})`);

    } catch (error: any) {
      stats.errors++;
      console.log(`  ❌ [${club.clubId}] Error: ${error.message?.substring(0, 80)}`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('   MIGRATION SUMMARY');
  console.log('========================================');
  console.log(`📊 Total clubs processed:  ${stats.total}`);
  console.log(`✅ Updated:                ${stats.updated}`);
  console.log(`👤 Owner updated:          ${stats.ownerUpdated}`);
  console.log(`⏭️  Skipped (no clubId):    ${stats.skippedNoClubId}`);
  console.log(`⏭️  Skipped (no images):    ${stats.skippedNoImages}`);
  console.log(`❌ Errors:                 ${stats.errors}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

