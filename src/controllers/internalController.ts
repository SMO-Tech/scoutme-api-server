import { MatchStatus } from "@prisma/client";
import { prisma } from "../utils/db";
import { Request, RequestHandler, Response } from "express";

export const nextMatch = async (req: Request, res: Response) => {
  try {
    const match = await prisma.match.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        videoUrl: true,
      },
    });

    // if no match, return immediately
    if (!match) {
      return res.status(200).json({ message: "No pending matches available." });
    }

    // send available match
    return res.status(200).json({
      message: "Next match is available to analyse",
      data: match,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch next match" });
  }
};

/**
 * update match status internal
 */
export const updateMatchStatusInternal: RequestHandler = async (req, res) => {
  try {
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

    return res
      .status(200)
      .json({ message: `Match status updated to ${status}` });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

/**
 * submit match analysis data internal
 */
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