import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// New database (smo_dev) - where we're migrating TO
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Old database (SMO_V1) - where we're migrating FROM
const smoV1ConnectionString = connectionString?.replace(/\/[^/]+$/, '/smo_v1');
const smoV1Pool = new Pool({ connectionString: smoV1ConnectionString });

// Intermediate database (SMO_V2) - where we're staging the data
const smoV2ConnectionString = connectionString?.replace(/\/[^/]+$/, '/smo_v2');
const smoV2Pool = new Pool({ connectionString: smoV2ConnectionString });

// S3 URL prefix for images/videos
const S3_PREFIX = 'https://smo-operation.s3.eu-west-2.amazonaws.com/';

// Test mode - set to number of matches to process (null for all)
const TEST_MODE_LIMIT: number | null = null;

// Stats
const stats = {
  total: 0,
  created: 0,
  skippedNoDetails: 0,
  skippedNoUser: 0,
  skippedNoVideo: 0,
  errors: 0
};

// Types for old database
type OldEvent = {
  event_id: number;
  title: string | null;
  description: string | null;
  user_id: number | null;
  starttime: Date | null;
  endtime: Date | null;
  location: string | null;
  country: string | null;
  city: string | null;
};

type OldMatch = {
  match_id: number;
  event_id: string | null;
  user_id: string | null;
  my_team: string | null;
  opponent_team: string | null;
  match_date_time: string | null;
  status: number | null;
  created: Date | null;
  modified: Date | null;
};

type OldMatchDetail = {
  detail_id: number;
  event_id: number | null;
  match_id: number | null;
  coach_id: number | null;
  winner: string | null;
  score: string | null;
  team_formation: string | null;
  opponent_team_formation: string | null;
  my_team: string | null; // JSON string
  opponent_team: string | null; // JSON string
  my_team_substitute: string | null; // JSON string
  opponent_team_substitute: string | null; // JSON string
  match_video: string | null;
  youtube_link: string | null;
  location: string | null;
  first_half_start: string | null;
  first_half_end: string | null;
  second_half_start: string | null;
  second_half_end: string | null;
  created: Date | null;
  modified: Date | null;
};

type PlayerLineup = {
  jersy_number: string;
  player_name: string;
  position: string;
};

// Helper function to parse score
function parseScore(scoreStr: string | null): { home: number; away: number } | null {
  if (!scoreStr) return null;
  
  // Handle formats: "3-2", "3/2", "0/0", etc.
  const match = scoreStr.match(/(\d+)[\-\/](\d+)/);
  if (match) {
    return {
      home: parseInt(match[1], 10),
      away: parseInt(match[2], 10)
    };
  }
  return null;
}

// Helper function to parse date
function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Helper function to find User by player_id
async function findUserByPlayerId(playerId: number | null): Promise<string | null> {
  if (!playerId) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { player_id: playerId },
      select: { id: true }
    });
    return user?.id || null;
  } catch {
    return null;
  }
}

// Helper function to find or create PlayerProfile by email
async function findOrCreatePlayerProfile(
  email: string,
  jerseyNumber: number,
  position: string
): Promise<string | null> {
  if (!email || !email.includes('@')) return null;
  
  try {
    // Try to find existing player by email (assuming email is stored somewhere)
    // For now, we'll need to check if there's a way to match by email
    // This is a placeholder - you may need to adjust based on your PlayerProfile schema
    
    // If we can't find by email, we might need to create a new profile
    // But for migration, let's skip creating new profiles and return null
    // You can enhance this later
    
    return null;
  } catch {
    return null;
  }
}

// Helper function to parse JSON lineup
function parseLineup(jsonStr: string | null): PlayerLineup[] {
  if (!jsonStr) return [];
  
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((p: any) => p && p.player_name && p.jersy_number);
    }
    return [];
  } catch {
    return [];
  }
}

// Create smo_match table in smo_v2 if it doesn't exist
async function createSmoMatchTable() {
  console.log('📋 Creating smo_match table in SMO_V2...\n');
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS smo_match (
      id SERIAL PRIMARY KEY,
      match_id INTEGER,
      event_id INTEGER,
      user_id INTEGER,
      my_team VARCHAR(255),
      opponent_team VARCHAR(255),
      match_date_time TIMESTAMP,
      competition_name VARCHAR(255),
      venue VARCHAR(255),
      video_url TEXT,
      youtube_link TEXT,
      home_score INTEGER,
      away_score INTEGER,
      team_formation VARCHAR(50),
      opponent_formation VARCHAR(50),
      winner VARCHAR(255),
      location VARCHAR(255),
      first_half_start VARCHAR(50),
      first_half_end VARCHAR(50),
      second_half_start VARCHAR(50),
      second_half_end VARCHAR(50),
      my_team_lineup JSONB,
      opponent_team_lineup JSONB,
      my_team_substitutes JSONB,
      opponent_team_substitutes JSONB,
      raw_data JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(match_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_smo_match_match_id ON smo_match(match_id);
    CREATE INDEX IF NOT EXISTS idx_smo_match_event_id ON smo_match(event_id);
    CREATE INDEX IF NOT EXISTS idx_smo_match_user_id ON smo_match(user_id);
  `;
  
  try {
    await smoV2Pool.query(createTableQuery);
    console.log('✅ smo_match table created/verified\n');
  } catch (error: any) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('   MIGRATE MATCH ANALYSIS FROM SMO_V1');
  console.log('   TO SMO_V2 (smo_match table)');
  console.log('========================================\n');

  // Create the table first
  await createSmoMatchTable();

  // Fetch all matches from old database
  let oldMatches: OldMatch[];
  
  if (TEST_MODE_LIMIT) {
    console.log(`🧪 TEST MODE: Processing ${TEST_MODE_LIMIT} matches\n`);
    const result = await smoV1Pool.query(
      'SELECT * FROM engine4_event_matchs ORDER BY match_id LIMIT $1',
      [TEST_MODE_LIMIT]
    );
    oldMatches = result.rows;
  } else {
    console.log('📊 Fetching all matches from SMO_V1...\n');
    const result = await smoV1Pool.query('SELECT * FROM engine4_event_matchs ORDER BY match_id');
    oldMatches = result.rows;
  }

  stats.total = oldMatches.length;
  console.log(`📊 Total matches to process: ${stats.total}\n`);

  if (oldMatches.length === 0) {
    console.log('No matches found in SMO_V1.');
    return;
  }

  // Create a map of event_id -> event data
  const eventIds = [...new Set(oldMatches.map(m => m.event_id).filter(Boolean))];
  console.log(`📅 Fetching ${eventIds.length} events...\n`);
  
  const eventsMap = new Map<number, OldEvent>();
  if (eventIds.length > 0) {
    const eventIdsStr = eventIds.join(',');
    const eventsResult = await smoV1Pool.query(
      `SELECT * FROM engine4_event_events WHERE event_id IN (${eventIdsStr})`
    );
    eventsResult.rows.forEach((event: OldEvent) => {
      eventsMap.set(event.event_id, event);
    });
  }

  console.log('Processing matches...');
  console.log('----------------------------------------');

  for (const oldMatch of oldMatches) {
    try {
      // Get match details
      const detailsResult = await smoV1Pool.query<OldMatchDetail>(
        'SELECT * FROM engine4_event_details WHERE match_id = $1 LIMIT 1',
        [oldMatch.match_id]
      );

      const matchDetail = detailsResult.rows[0];

      if (!matchDetail) {
        stats.skippedNoDetails++;
        console.log(`  ⏭️  [${oldMatch.match_id}] Skipped - no match details`);
        continue;
      }

      // Note: We'll store the user_id as integer in smo_match, no need to validate it exists
      // This allows us to import all matches and handle user mapping later

      // Get event info
      const eventId = parseInt(oldMatch.event_id || '0', 10);
      const event = eventId ? eventsMap.get(eventId) : null;

      // Parse score (allow matches without score for now)
      const score = parseScore(matchDetail.score);
      if (!score) {
        // Use 0-0 as default if no score
        console.log(`  ⚠️  [${oldMatch.match_id}] No score found, using 0-0`);
      }

      // Parse match date
      const matchDate = parseDate(oldMatch.match_date_time || (matchDetail.created ? matchDetail.created.toISOString() : null));

      // Get video URL
      const videoUrl = matchDetail.youtube_link || 
                      (matchDetail.match_video ? S3_PREFIX + matchDetail.match_video : null);

      if (!videoUrl) {
        stats.skippedNoVideo++;
        console.log(`  ⏭️  [${oldMatch.match_id}] Skipped - no video URL`);
        continue;
      }

      // Parse and store player lineups
      const myTeamLineup = parseLineup(matchDetail.my_team);
      const opponentLineup = parseLineup(matchDetail.opponent_team);
      const myTeamSubs = parseLineup(matchDetail.my_team_substitute);
      const opponentSubs = parseLineup(matchDetail.opponent_team_substitute);

      // Insert into smo_match table in smo_v2
      const insertQuery = `
        INSERT INTO smo_match (
          match_id, event_id, user_id, my_team, opponent_team, match_date_time,
          competition_name, venue, video_url, youtube_link,
          home_score, away_score, team_formation, opponent_formation, winner, location,
          first_half_start, first_half_end, second_half_start, second_half_end,
          my_team_lineup, opponent_team_lineup, my_team_substitutes, opponent_team_substitutes,
          raw_data, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        )
        ON CONFLICT (match_id) DO NOTHING
      `;

      await smoV2Pool.query(insertQuery, [
        oldMatch.match_id,
        eventId || null,
        oldMatch.user_id ? parseInt(oldMatch.user_id, 10) : null,
        oldMatch.my_team,
        oldMatch.opponent_team,
        matchDate,
        event?.title || null,
        matchDetail.location || event?.location || null,
        matchDetail.match_video || null,
        matchDetail.youtube_link || null,
        score?.home || 0,
        score?.away || 0,
        matchDetail.team_formation || null,
        matchDetail.opponent_team_formation || null,
        matchDetail.winner || null,
        matchDetail.location || null,
        matchDetail.first_half_start || null,
        matchDetail.first_half_end || null,
        matchDetail.second_half_start || null,
        matchDetail.second_half_end || null,
        JSON.stringify(myTeamLineup),
        JSON.stringify(opponentLineup),
        JSON.stringify(myTeamSubs),
        JSON.stringify(opponentSubs),
        JSON.stringify({
          originalMatchDetail: matchDetail,
          originalMatch: oldMatch,
          event: event
        }),
        oldMatch.created || new Date(),
        oldMatch.modified || new Date()
      ]);

      stats.created++;
      console.log(`  ✅ [${oldMatch.match_id}] Imported to smo_match: ${oldMatch.my_team} vs ${oldMatch.opponent_team}`);
      console.log(`     Score: ${score?.home || 0}-${score?.away || 0}, Video: ${videoUrl?.substring(0, 50) || 'N/A'}...`);

    } catch (error: any) {
      stats.errors++;
      console.log(`  ❌ [${oldMatch.match_id}] Error: ${error.message?.substring(0, 80)}`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('   MIGRATION SUMMARY');
  console.log('========================================');
  console.log(`📊 Total matches processed:  ${stats.total}`);
  console.log(`✅ Imported to smo_match:     ${stats.created}`);
  console.log(`⏭️  Skipped (no details):     ${stats.skippedNoDetails}`);
  console.log(`⏭️  Skipped (no video):       ${stats.skippedNoVideo}`);
  console.log(`❌ Errors:                   ${stats.errors}`);
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
    await smoV1Pool.end();
    await smoV2Pool.end();
  });

