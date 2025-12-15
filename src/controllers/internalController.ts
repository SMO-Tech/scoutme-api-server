import { prisma } from "../utils/db";
import { Request, Response } from "express";

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
