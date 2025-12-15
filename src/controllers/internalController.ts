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

export const updateMatchStatus: RequestHandler = async (req, res) => {
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
