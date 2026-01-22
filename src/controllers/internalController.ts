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
    
    // 1. VALIDATE INPUTS
    if (!matchId?.trim()) {
      return res.status(400).json({ error: "matchId is required" });
    }

    // Determine data structure (Handle both raw array and object wrapper)
    let finalJsonData: any;
    if (Array.isArray(req.body)) {
      finalJsonData = { events: req.body };
    } else if (req.body && Array.isArray(req.body.result)) {
      finalJsonData = req.body;
    } else {
      return res.status(400).json({ 
        error: "Invalid body format. Expected array or object with 'result'." 
      });
    }

    if (!finalJsonData) {
      return res.status(400).json({ error: "No analysis data provided" });
    }

    // 2. CHECK MATCH EXISTS
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!existingMatch) {
      return res.status(404).json({ error: "Match not found" });
    }

    // 3. UPDATE DATA ONLY (No Status Change)
    // We strictly only save the JSON blob. Status remains PENDING/PROCESSING.
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        analysisData: finalJsonData, 
        // status: "COMPLETED", <--- REMOVED per your request
        // progress: 100        <--- REMOVED per your request
      }
    });
    
    // 4. SUCCESS RESPONSE
    return res.status(200).json({
      message: "Analysis data saved successfully",
      id: updatedMatch.id,
    });

  } catch (e: any) {
    console.error("Submit Analysis Error:", e);
    return res.status(500).json({ error: e.message || "Something went wrong" });
  }
};