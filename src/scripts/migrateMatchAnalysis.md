# Match Analysis Migration Plan

## Source Tables (SMO_V1)

### 1. engine4_event_events (948 rows)
- **event_id**: Primary key
- **title**: Event/tournament name
- **description**: Event description
- **user_id**: Event creator
- **starttime, endtime**: Event dates
- **location, country, city**: Event location
- **photo_id**: Event photo

### 2. engine4_event_matchs (1122 rows)
- **match_id**: Primary key
- **event_id**: Links to engine4_event_events
- **user_id**: Match creator
- **my_team**: User's team name
- **opponent_team**: Opponent team name
- **match_date_time**: Match date/time
- **status**: Match status

### 3. engine4_event_details (882 rows)
- **detail_id**: Primary key
- **event_id**: Links to engine4_event_events
- **match_id**: Links to engine4_event_matchs
- **coach_id**: Coach user ID
- **winner**: Winner team
- **score**: Match score (format: "3-2" or "3/2")
- **team_formation**: User team formation (e.g., "4-4-2")
- **opponent_team_formation**: Opponent formation
- **my_team**: JSON array of players with jersey_number, player_name, position
- **opponent_team**: JSON array of opponent players
- **my_team_substitute**: JSON array of substitutes
- **opponent_team_substitute**: JSON array of opponent substitutes
- **match_video**: Video file path
- **youtube_link**: YouTube URL
- **location**: "Home" or "Away"
- **first_half_start/end**: Timestamps
- **second_half_start/end**: Timestamps

### 4. engine4_event_photos (603 rows)
- **photo_id**: Primary key
- **event_id**: Links to engine4_event_events
- **file_id**: Links to media_files table
- **user_id**: Photo uploader

## Target Schema Mapping

### Match Table
- `competitionName` <- event_events.title
- `matchDate` <- event_matchs.match_date_time
- `venue` <- event_details.location + event_events.location
- `videoUrl` <- event_details.youtube_link OR event_details.match_video
- `userId` <- event_matchs.user_id (map via User.player_id)
- `status` <- event_matchs.status (map: 1=PENDING, others?)
- `level` <- Default to PROFESSIONAL (or infer from event_type)

### MatchClub Table
- Create 2 entries per match:
  - `isUsersTeam=true`: my_team from event_matchs
  - `isUsersTeam=false`: opponent_team from event_matchs
- `name` <- my_team / opponent_team
- `country` <- event_events.country

### MatchResult Table
- `homeScore` / `awayScore` <- Parse score from event_details.score
- `rawAiOutput` <- Store formations and other metadata as JSON

### MatchPlayer Table
- Parse JSON from event_details.my_team and opponent_team
- Create MatchPlayer entries for each player
- Link to PlayerProfile by email (player_name field)

## Migration Strategy

1. Process events first to get competition names
2. For each match in event_matchs:
   - Find corresponding event_details by match_id
   - Create Match record
   - Create MatchClub records (my_team and opponent_team)
   - Parse and create MatchPlayer records from JSON
   - Create MatchResult with score and metadata
3. Handle photos separately (could link to matches via event_id)

## Challenges

1. **Score parsing**: Format varies ("3-2", "3/2", "0/0")
2. **Player matching**: player_name is email, need to match to PlayerProfile
3. **Date parsing**: match_date_time format may vary
4. **User mapping**: user_id (int) -> User.id (string) via player_id
5. **Missing data**: Some matches may not have details

