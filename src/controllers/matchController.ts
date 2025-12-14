import { Request, RequestHandler, Response } from "express";
import { MatchStatusBody, RequestMatchAnalysisBody } from "../@types";
import { prisma } from "../utils/db";

export const requestMatchAnalysis: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    //find user from auht middleware
    const { uid } = req.user;
   

    // check if user exist
    const user = await prisma.user.findUnique({ where: { UID: uid } });
 
    if (!user) return res.status(400).json({ error: "user not found!" });

    const { videoUrl, players, lineUpImage } =
      req.body as RequestMatchAnalysisBody;

    const match = await prisma.matchRequest.create({
      data: {
        userId: uid,
        videoUrl,
        lineUpImage,
        players: {
          create: players,
        },
      },
      include: { players: true },
    });

    return res.status(201).json({
      message: "Match analysis request created succesfully!",
      data: match,
    });
  } catch (e: any) {
   
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

export const allmatchRequestsOfUser: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    //find user from auht middleware
    const { uid } = req.user;

    // check if user exist
    const user = await prisma.user.findUnique({ where: { UID: uid } });
    if (!user) return res.status(400).json({ error: "user not found!" });

    const allMatchRequests = await prisma.matchRequest.findMany({
      //find all match analysis request by User
      where: {
        userId: user.UID,
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

export const getSpecificMatchAnalysis: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    //find user from auht middleware
    const { uid } = req.user;

    // check if user exist
    const user = await prisma.user.findUnique({ where: { UID: uid } });
    if (!user) return res.status(400).json({ error: "user not found!" });

    //get the matchId
    const { matchId } = req.params;

    //if no matchId return error
    if (!matchId) return res.status(400).json({ error: "matchId not found!" });

    //check if matchId exist
    const isValidId = await prisma.matchRequest.findUnique({
      where: { id: matchId },
    });
    //if no id mathces return error
    if (!isValidId)
      return res.status(400).json({ error: "The match is not found" });

    const matchInfo = await prisma.matchRequest.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        videoUrl: true,
        status: true,
        players: {
          select: {
            name: true,
            jerseyNumber: true,
            position: true,
          },
        },
        analysis: {
          select: {
            result: true,
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
    // const { uid } = req.user as { uid: string };

    // const user = await prisma.user.findUnique({ where: { UID: uid } });
    // if (!user) return res.status(404).json({ error: "User not found!" });

    const { matchId } = req.params;
    if (!matchId) return res.status(400).json({ error: "matchId not found!" });

    const match = await prisma.matchRequest.findUnique({
      where: { id: matchId },
    });
    if (!match) return res.status(404).json({ error: "Match not found!" });
   

    const { status } = req.body as MatchStatusBody;
    if (!["PENDING", "PROCESSING", "COMPLETED"].includes(status))
      return res.status(400).json({ error: "Invalid or missing status" });

    await prisma.matchRequest.update({
      where: { id: matchId },
      data: { status },
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
    const existingMatch = await prisma.matchRequest.findUnique({
      where: { id: matchId }
    });

    if (!existingMatch) {
      return res.status(404).json({ error: "MatchRequest not found" });
    }

    const analysis = await prisma.matchAnalysis.upsert({
      where: { 
        matchId: matchId  // This determines if record exists
      },
      update: { 
        result: result,    // If exists, update
        // updatedAt: new Date()
      },
      create: { 
        matchId: matchId,  // If doesn't exist, create
        result: result
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