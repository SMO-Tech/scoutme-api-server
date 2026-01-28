import { Request, RequestHandler, Response } from "express";

import { prisma } from "../utils/db";
import { MatchLevel } from "@prisma/client";

// Define body interface if not already defined
interface RequestMatchAnalysisBody {
  videoUrl: string;
  matchLevel: MatchLevel;
  homeTeam: string;
  awayTeam: string;
  focusHint?: string;
}

export const createMatchRequest: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    // 1. Get the Firebase UID from the auth middleware
    const { uid } = (req as any).user;

    // Data is already validated by Zod middleware
    const { videoUrl, matchLevel, awayTeam, homeTeam, focusHint } =
      req.body as RequestMatchAnalysisBody;

    // 2. Use a Transaction to handle Credits + Match Creation safely
    const result = await prisma.$transaction(async (tx) => {
      // A. Check User Balance & Pro Status
      const user = await tx.user.findUnique({
        where: { id: uid },
        select: { credits: true, isPro: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Logic: If user is NOT pro, they need positive credits
      if (!user.isPro && user.credits < 1) {
        throw new Error("Insufficient credits");
      }

      // B. Create the Match
      const newMatch = await tx.match.create({
        data: {
          userId: uid,
          videoUrl: videoUrl,
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          matchLevel: matchLevel,
          focusHint: focusHint || null,
          status: "PENDING",
          title: `${homeTeam} vs ${awayTeam}`,
        },
      });

      // C. Deduct Credit (Only if not Pro)
      if (!user.isPro) {
        await tx.user.update({
          where: { id: uid },
          data: {
            credits: {
              decrement: 1,
            },
          },
        });
      }

      return newMatch;
    });

    // 3. Success Response
    res.status(201).json({
      success: true,
      match: result,
      message: "Match submitted for analysis",
    });
  } catch (error: any) {
    console.error("Create Match Error:", error);

    if (error.message === "Insufficient credits") {
      res.status(403).json({ error: "You do not have enough credits." });
      return;
    }
    if (error.message === "User not found") {
      res.status(404).json({ error: "User account not found." });
      return;
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const allmatchOfUser: RequestHandler = async (
  req: Request,
  res: Response,
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

export const getMatchAnalysis: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { matchId } = req.params;
    const userId = (req as any).user?.id; // injected by auth middleware

    if (!matchId) {
      return res.status(400).json({ message: "Match ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        userId, 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!match) {
      return res.status(404).json({
        message: "Match not found or access denied",
      });
    }

    return res.status(200).json({
      message: "Match analysis fetched successfully",
      data: {
        id: match.id,
        title: match.title,
        videoUrl: match.videoUrl,
        status: match.status,

        // Metadata
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchDate: match.matchDate,
        location: match.location,
        level: match.matchLevel,
        gender: match.gender,

        // AI Output
        analysisData: match.analysisData,
        analysisVersion: match.analysisVersion,

        // Ownership
        owner: match.user,

        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("getMatchAnalysis error:", error);
    return res.status(500).json({
      message: "Failed to fetch match analysis",
    });
  }
};
