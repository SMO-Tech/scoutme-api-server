import { Request, RequestHandler, Response } from "express";
import { RequestMatchAnalysisBody } from "../@types";
import { prisma } from "../utils/db";
import { MatchStatus, MatchLevel } from "@prisma/client";

export const createMatchRequest: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { uid } = req.user;

    // Check user
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return res.status(400).json({ error: "User not found!" });

    // Destructure request body
    const { videoUrl, clubs, lineUpImage, matchLevel, players } =
      req.body as RequestMatchAnalysisBody;

    // Step 1: Create Match
    const match = await prisma.match.create({
      data: {
        userId: uid,
        videoUrl,
        level: (matchLevel as MatchLevel) || MatchLevel.SUNDAY_LEAGUE,
        // lineUpImage,
      },
    });

    // Step 2: Create or connect clubs
    // const clubMap: Record<string, string> = {}; // teamType => matchClubId
    // for (const clubInput of clubs) {
    //   const { name, country, jerseyColor, teamType, logoUrl } = clubInput;
    //   const isUsersClub = teamType === "yourTeam";

    //   // Try to find existing canonical club
    //   let club = await prisma.club.findUnique({
    //     where: { name_country: { name, country } },
    //   });

    //   if (!club) {
    //     club = await prisma.club.create({
    //       data: { name, country, logoUrl },
    //     });
    //   }

    //   // Create MatchClub
    //   const matchClub = await prisma.matchClub.create({
    //     data: {
    //       matchId: match.id,
    //       clubId: club.id,
    //       name,
    //       country,
    //       jerseyColor,
    //       isUsersTeam: isUsersClub,
    //     },
    //   });

    //   clubMap[teamType] = matchClub.id;
    // }

    // // Step 3: Create players and link to MatchClub
    // for (const playerInput of players) {
    //   const {
    //     firstName,
    //     lastName,
    //     jerseyNumber,
    //     dateOfBirth,
    //     position,
    //     country,
    //     teamType,
    //   } = playerInput;

    //   let playerProfileId: string | undefined;

    //   // if dob not given put default DOB
    //   const dob = dateOfBirth ? new Date(dateOfBirth) : new Date("1900-01-01");

    //   const hasFullDetails =
    //     firstName && lastName && dateOfBirth && position && country;

    //   // Create canonical profile for your team or complete opponent player
    //   if (
    //     teamType === "yourTeam" ||
    //     (teamType === "opponentTeam" && hasFullDetails)
    //   ) {
    //     // const dob = dateOfBirth ? new Date(dateOfBirth) : undefined;

    //     const existingProfile = await prisma.playerProfile.findUnique({
    //       where: {
    //         firstName_lastName_dateOfBirth_country: {
    //           firstName,
    //           lastName,
    //           dateOfBirth: dob,
    //           country,
    //         },
    //       },
    //     });

    //     if (existingProfile) {
    //       playerProfileId = existingProfile.id;
    //     } else if (dob) {
    //       const newProfile = await prisma.playerProfile.create({
    //         data: {
    //           firstName,
    //           lastName,
    //           dateOfBirth: dob,
    //           country,
    //           primaryPosition: position,
    //         },
    //       });
    //       playerProfileId = newProfile.id;
    //     }
    //   }

    //   // Step 4: Create MatchPlayer
    //   const matchPlayerData: any = {
    //     matchId: match.id,
    //     matchClubId: clubMap[teamType], // <-- use the foreign key directly
    //     jerseyNumber,
    //     position,
    //     isHomeTeam: teamType === "yourTeam",
    //   };

    //   // Only include playerProfileId if it exists
    //   if (playerProfileId) {
    //     matchPlayerData.playerProfileId = playerProfileId;
    //   }
    //   await prisma.matchPlayer.create({
    //     data: matchPlayerData,
    //   });
    // }

    res.status(201).json({
      status: "success",
      message: "Match request created successfully!",
      data: {
        matchId: match.id,
      },
    });
  } catch (e: any) {
    res.status(500).json({
      status: "error",
      message: e.message || "Something went wrong",
    });
  }
};

export const allmatchOfUser: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    //find user from auht middleware
    const { uid } = req.user;

    // check if user exist
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return res.status(400).json({ error: "user not found!" });

    const allMatchRequests = await prisma.match.findMany({
      //find all match analysis request by User
      where: {
        userId: user.id,
      },
      //order by newest request
      orderBy: {
        createdAt: "desc",
      },
      //select the field to fetch
      select: {
        status: true,
        id: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Match requestes fetched successfully",
      data: allMatchRequests,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

/**
 * Public endpoint to fetch a list of all matches on the platform,
 * regardless of the user who requested them.
 * * NOTE: The user check (uid, user validation) is kept but is NOT used
 * for filtering the matches, only for logging/context if needed.
 */
export const allMatch: RequestHandler = async (req: Request, res: Response) => {
  try {
    // 1. User Context (Retained from original code, but not used for filtering)
    // const { uid } = (req as any).user;
    // const user = await prisma.user.findUnique({ where: { id: uid } });
    // if (!user) return res.status(400).json({ error: "user not found!" });

    // 2. Pagination Defaults
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 3. Fetch Matches with Relational Data (Clubs and Result)
    const matches = await prisma.match.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      // where: {
      //   status: "COMPLETED", // Optional: Filter only completed matches
      // },
      // ✅ INCLUDE RELATIONAL DATA FOR LIST VIEW
      include: {
        // Fetch the score for display
        result: {
          select: {
            homeScore: true,
            awayScore: true,
          },
        },
        // Fetch the clubs involved (Home and Away names)
        matchClubs: {
          select: {
            name: true,
            isUsersTeam: true, // true for home, false for away/opponent
            jerseyColor: true,
            // Fetch the canonical logo if the club is linked
            club: {
              select: { logoUrl: true },
            },
          },
        },
        // Fetch the user who uploaded the match
        user: {
          select: { name: true },
        },
      },
    });

    // 4. Get Total Count
    const totalMatches = await prisma.match.count({});

    // 5. Response
    return res.status(200).json({
      message: "Match data fetched successfully",
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalMatches / limit),
        totalItems: totalMatches,
      },
      data: matches,
    });
  } catch (e: any) {
    console.error("Error fetching all matches:", e);
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

export const getMatchAnalysis: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    //find user from auht middleware
    const { uid } = req.user;

    // check if user exist
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return res.status(400).json({ error: "user not found!" });

    //get the matchId
    const { matchId } = req.params;

    //if no matchId return error
    if (!matchId) return res.status(400).json({ error: "matchId not found!" });

    //check if matchId exist
    const isValidId = await prisma.match.findUnique({
      where: { id: matchId },
    });
    //if no id mathces return error
    if (!isValidId)
      return res.status(400).json({ error: "The match is not found" });

    // const matchInfo = await prisma.match.findUnique({
    //   where: { id: matchId },
    //   select: {
    //     id: true,
    //     videoUrl: true,
    //     status: true,
    //     level: true,
    //     matchDate: true,
    //     competitionName: true,
    //     venue: true,

    //     matchClubs: {
    //       select: {
    //         id: true,
    //         name: true,
    //         country: true,
    //         jerseyColor: true,
    //         isUsersTeam: true,
    //         club: {
    //           select: {
    //             id: true,
    //             logoUrl: true,
    //           },
    //         },
    //       },
    //     },

    //     matchPlayers: {
    //       select: {
    //         jerseyNumber: true,
    //         position: true,
    //         playerProfile: {
    //           select: {
    //             firstName: true,
    //             lastName: true,
    //             country: true,
    //             primaryPosition: true,
    //             avatar: true,
    //           },
    //         },
    //       },
    //     },

    //     result: {
    //       select: {
    //         homeScore: true,
    //         awayScore: true,
    //         homePossession: true,
    //         awayPossession: true,
    //       },
    //     },
    //   },
    // });

    const matchInfo = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        videoUrl: true,
        result: {
          select: {
            rawAiOutput: true,
          },
        },
      },
    });
    console.log(matchInfo)

    if (!matchInfo) return res.status(400).json({ error: "match not found!" });

    return res.status(200).json({
      message: "Match analysis successfully fetched!",
      videoUrl: matchInfo.videoUrl,
      data: matchInfo.result?.rawAiOutput ?? null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

export const legacyMatchInfo: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    // Pagination parameters
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Only fetch essential fields for list view (exclude large JSON fields)
    // Fetch matches first, then count separately with error handling
    const legacyMatches = await prisma.smo_match.findMany({
      skip,
      take: limit,
      orderBy: [
        {
          match_date_time: "desc", // Latest dates first, nulls last (default behavior)
        },
        // {
        //   id: 'desc', // Secondary sort by ID for consistent ordering when dates are equal/null
        // }
      ],
      select: {
        id: true,
        match_id: true,
        my_team: true,
        opponent_team: true,
        home_score: true,
        away_score: true,
        match_date_time: true,
        competition_name: true,
        venue: true,
        youtube_link: true,
        team_formation: true,
        opponent_formation: true,
        winner: true,
        location: true,
        first_half_start: true,
        first_half_end: true,
        second_half_start: true,
        second_half_end: true,
        // Only fetch lineup/substitute counts, not full JSON data
        my_team_lineup: true,
        my_team_substitutes: true,
        user_id: true,
        // Exclude: opponent_team_lineup, opponent_team_substitutes, raw_data, created_at, updated_at
      },
    });

    // Get unique user_ids (filter out nulls)
    const userIds: number[] = Array.from(
      new Set(
        legacyMatches
          .map((m: any) => m.user_id as number | null)
          .filter(
            (id: number | null): id is number =>
              id !== null && typeof id === "number"
          )
      )
    );

    // Fetch all users in one query
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: {
              player_id: {
                in: userIds,
              },
            },
            select: {
              player_id: true,
              name: true,
              email: true,
              photoUrl: true,
              id: true,
            },
          })
        : [];

    // Create a map for quick lookup: user_id -> user
    const userMap = new Map(users.map((user) => [user.player_id, user]));

    // Try to get total count, but don't fail if it times out
    let totalMatches = legacyMatches.length; // Default to current page count
    try {
      totalMatches = (await Promise.race([
        prisma.smo_match.count({}),
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error("Count query timeout")), 5000)
        ),
      ])) as number;
    } catch (countError: any) {
      // If count fails, estimate based on current results
      // If we got a full page, there might be more
      if (legacyMatches.length === limit) {
        totalMatches = page * limit + 1; // Estimate: at least one more page
      } else {
        totalMatches = skip + legacyMatches.length; // Exact count if last page
      }
      console.warn("Count query failed, using estimate:", countError.message);
    }

    // Sort matches to ensure latest dates are on top, null dates at bottom
    // This is a safety measure in case database sorting doesn't handle nulls as expected
    const sortedMatches = [...legacyMatches].sort((a: any, b: any) => {
      // If both have dates, sort by date descending (newest first)
      if (a.match_date_time && b.match_date_time) {
        return (
          new Date(b.match_date_time).getTime() -
          new Date(a.match_date_time).getTime()
        );
      }
      // If only a has a date, it comes first
      if (a.match_date_time && !b.match_date_time) return -1;
      // If only b has a date, it comes first
      if (!a.match_date_time && b.match_date_time) return 1;
      // If both are null, maintain original order (or sort by ID descending)
      return (b.id || 0) - (a.id || 0);
    });

    const formattedJson = sortedMatches.map((match: any) => {
      // Calculate duration in minutes
      let duration = 0;
      if (match.first_half_start && match.first_half_end) {
        const firstHalf =
          parseTimeToMinutes(match.first_half_end) -
          parseTimeToMinutes(match.first_half_start);
        duration += firstHalf || 0;
      }
      if (match.second_half_start && match.second_half_end) {
        const secondHalf =
          parseTimeToMinutes(match.second_half_end) -
          parseTimeToMinutes(match.second_half_start);
        duration += secondHalf || 0;
      }

      // Count players in starting lineup
      const startingPlayersCount = Array.isArray(match.my_team_lineup)
        ? match.my_team_lineup.length
        : match.my_team_lineup
        ? Object.keys(match.my_team_lineup).length
        : 0;

      // Count substitutes
      const substitutesCount = Array.isArray(match.my_team_substitutes)
        ? match.my_team_substitutes.length
        : match.my_team_substitutes
        ? Object.keys(match.my_team_substitutes).length
        : 0;

      // Determine result
      let result = "Draw";
      if (match.winner) {
        result = match.winner;
      } else if (match.home_score !== null && match.away_score !== null) {
        if (match.home_score > match.away_score) {
          result = match.my_team || "Home";
        } else if (match.away_score > match.home_score) {
          result = match.opponent_team || "Away";
        }
      }

      // Format date
      const matchDate = match.match_date_time
        ? new Date(match.match_date_time).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : null;

      // Determine if Home or Away (assuming my_team is home if location/venue matches)
      const isHome =
        match.location?.toLowerCase().includes("home") ||
        match.venue?.toLowerCase().includes(match.my_team?.toLowerCase() || "");

      return {
        id: match.id,
        youtube_link: match.youtube_link,
        user: {
          name: userMap.get(match.user_id)?.name,
          email: userMap.get(match.user_id)?.email,
          userId: userMap.get(match.user_id)?.id,
          photoUrl: userMap.get(match.user_id)?.photoUrl,
        },
        teams: {
          home: match.my_team,
          away: match.opponent_team,
          display: `${match.my_team || "Team 1"} VS ${
            match.opponent_team || "Team 2"
          }`,
        },
        score: {
          home: match.home_score ?? 0,
          away: match.away_score ?? 0,
          display: `${match.home_score ?? 0} - ${match.away_score ?? 0}`,
          result: result,
        },
        date: matchDate,
        venue: isHome ? "Home" : "Away",
        formation: {
          home: match.team_formation,
          away: match.opponent_formation,
          display: `${match.team_formation || "N/A"} vs ${
            match.opponent_formation || "N/A"
          }`,
        },
        players: {
          starting: startingPlayersCount,
          substitutes: substitutesCount,
          display: `${startingPlayersCount} starting • ${substitutesCount} subs`,
        },
        duration:
          duration > 0
            ? `${duration}'${duration > 90 ? " (with extra time)" : ""}`
            : null,
      };
    });

    res.json({
      status: "success",
      message: "Legacy match info fetched successfully",
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalMatches / limit),
        totalItems: totalMatches,
      },
      data: formattedJson,
    });
  } catch (e: any) {
    console.error("Error in legacyMatchInfo:", e);

    // Check if it's a database connection error
    if (
      e.message?.includes("Can't reach database server") ||
      e.message?.includes("connection") ||
      e.code === "P1001"
    ) {
      return res.status(503).json({
        status: "error",
        error:
          "Database connection error. Please check your database server is running and accessible.",
        message: e.message || "Database unavailable",
      });
    }

    res.status(500).json({
      status: "error",
      error: e.message || "Something went wrong",
    });
  }
};

// Helper function to parse time string to minutes
function parseTimeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0;
  // Handle formats like "45:30" or "45'30" or just "45"
  const match = timeStr.match(/(\d+)[:'](\d+)/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  const singleMatch = timeStr.match(/(\d+)/);
  return singleMatch ? parseInt(singleMatch[1]) : 0;
}

export const legacyMatchAnalysis: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    // Get match_id from query params or route params
    const matchIdParam =
      req.query.match_id ||
      req.params.match_id ||
      req.query.matchId ||
      req.params.matchId;

    if (!matchIdParam) {
      return res.status(400).json({
        status: "error",
        error:
          "match_id is required. Please provide match_id as query parameter or route parameter.",
      });
    }

    // Convert to string first, then to number
    const matchIdStr = String(matchIdParam);
    const matchIdNum = parseInt(matchIdStr, 10);

    if (isNaN(matchIdNum)) {
      return res.status(400).json({
        status: "error",
        error: "Invalid match_id. Must be a valid number.",
      });
    }

    // Fetch only the specific match by match_id
    const match = await prisma.smo_match.findUnique({
      where: {
        match_id: matchIdNum,
      },
      select: {
        id: true,
        match_id: true,
        my_team: true,
        opponent_team: true,
        home_score: true,
        away_score: true,
        match_date_time: true,
        competition_name: true,
        venue: true,
        youtube_link: true,
        team_formation: true,
        opponent_formation: true,
        winner: true,
        location: true,
        first_half_start: true,
        first_half_end: true,
        second_half_start: true,
        second_half_end: true,
        my_team_lineup: true,
        opponent_team_lineup: true,
        my_team_substitutes: true,
        opponent_team_substitutes: true,
        raw_data: true,
        created_at: true,
        updated_at: true,
        user_id: true,
      },
    });

    // Check if match exists
    if (!match) {
      return res.status(404).json({
        status: "error",
        error: `Match with match_id ${matchIdNum} not found.`,
      });
    }

    // Fetch user information if user_id exists
    let user = null;
    if (match.user_id) {
      const userData = await prisma.user.findUnique({
        where: {
          player_id: match.user_id,
        },
        select: {
          player_id: true,
          name: true,
          email: true,
        },
      });
      user = userData;
    }

    // Format the single match data
    const formattedMatch = {
      match_id: match.match_id,
      id: match.id,
      youtube_link: match.youtube_link,
      user: user ? { name: user.name, email: user.email } : null,
      match_info: {
        match_date_time: match.match_date_time,
        competition_name: match.competition_name,
        venue: match.venue,
        location: match.location,
      },
      teams: {
        my_team: match.my_team,
        opponent_team: match.opponent_team,
        my_team_formation: match.team_formation,
        opponent_team_formation: match.opponent_formation,
      },
      score: {
        home_score: match.home_score,
        away_score: match.away_score,
        winner: match.winner,
      },
      lineups: {
        my_team_starting_lineup: match.my_team_lineup,
        opponent_team_starting_lineup: match.opponent_team_lineup,
      },
      substitutes: {
        my_team_substitutes: match.my_team_substitutes,
        opponent_team_substitutes: match.opponent_team_substitutes,
      },
      match_timing: {
        first_half: {
          start: match.first_half_start,
          end: match.first_half_end,
        },
        second_half: {
          start: match.second_half_start,
          end: match.second_half_end,
        },
      },
      metadata: {
        raw_data: match.raw_data,
        created_at: match.created_at,
        updated_at: match.updated_at,
      },
    };

    res.json({
      status: "success",
      message: "Legacy match analysis fetched successfully",
      data: formattedMatch,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};
