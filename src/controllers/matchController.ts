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
      "status": "success",
      message: "Match request created successfully!",
      data: {
        matchId: match.id,
      },
    });
  } catch (e: any) {
    res.status(500).json({
      "status": "error",
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
          }
        },
        // Fetch the clubs involved (Home and Away names)
        matchClubs: {
          select: {
            name: true,
            isUsersTeam: true, // true for home, false for away/opponent
            jerseyColor: true,
            // Fetch the canonical logo if the club is linked
            club: {
              select: { logoUrl: true } 
            }
          }
        },
        // Fetch the user who uploaded the match
        user: {
            select: { name: true }
        }
      }
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

    const matchInfo = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        videoUrl: true,
        status: true,
        level: true,
        matchDate: true,
        competitionName: true,
        venue: true,

        matchClubs: {
          select: {
            id: true,
            name: true,
            country: true,
            jerseyColor: true,
            isUsersTeam: true,
            club: {
              select: {
                id: true,
                logoUrl: true,
              },
            },
          },
        },

        matchPlayers: {
          select: {
            jerseyNumber: true,
            position: true,
            playerProfile: {
              select: {
                firstName: true,
                lastName: true,
                country: true,
                primaryPosition: true,
                avatar: true,
              },
            },
          },
        },

        result: {
          select: {
            homeScore: true,
            awayScore: true,
            homePossession: true,
            awayPossession: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Match information is successfully fetched!",
      data: matchInfo,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

export const updateMatchStatus: RequestHandler = async (req, res) => {
  try {
    const { uid } = req.user as { uid: string };

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return res.status(404).json({ error: "User not found!" });

    const { matchId } = req.params;
    if (!matchId) return res.status(400).json({ error: "matchId not found!" });

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) return res.status(404).json({ error: "Match not found!" });

    interface MatchStatusBody {
      status: MatchStatus;
    }

    const { status } = req.body as MatchStatusBody;
    if (!["PENDING", "PROCESSING", "COMPLETED"].includes(status))
      return res.status(400).json({ error: "Invalid or missing status" });

    await prisma.match.update({
      where: { id: matchId },
      data: { status: status },
    });

    return res
      .status(200)
      .json({ message: `Match status updated to ${status}` });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

export const submitMatchAnalysis: RequestHandler = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // VALIDATE INPUTS RUTHLESSLY
    if (!matchId?.trim()) {
      return res.status(400).json({ error: "matchId is required and cannot be empty" });
    }

    // Handle both formats: { result: [...] } or raw array [...]
    let result: any[];
    if (Array.isArray(req.body)) {
      // If body is a raw array, use it directly
      result = req.body;
    } else if (req.body && Array.isArray(req.body.result)) {
      // If body has a result property with an array, use that
      result = req.body.result;
    } else {
      return res.status(400).json({ 
        error: "Request body must be an array or an object with a 'result' array property" 
      });
    }

    // Validate the result array
    if (!result || result.length === 0) {
      return res.status(400).json({ 
        error: "result must be a non-empty array with proper structure" 
      });
    }

    // 3. CHECK IF MATCH EXISTS FIRST
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!existingMatch) {
      return res.status(404).json({ error: "MatchRequest not found" });
    }

    const analysis = await prisma.matchResult.upsert({
      where: { 
        matchId: matchId  // This determines if record exists
      },
      update: { 
        rawAiOutput: result,    // If exists, update
        // updatedAt: new Date()
      },
      create: { 
        matchId: matchId,  // If doesn't exist, create
        rawAiOutput: result,
        homeScore: 0,
        awayScore: 0
      }
    });
    
    
    // 6. SUCCESS RESPONSE
    return res.status(201).json({
      message: "Match analysis submitted successfully",
      id: analysis.id,
      matchId: analysis.matchId
    });

  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Something went wrong" });
  }
};