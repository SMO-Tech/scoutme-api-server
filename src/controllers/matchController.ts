import { Request, RequestHandler, Response } from "express";
import { RequestMatchAnalysisBody } from "../@types";
import { prisma } from "../utils/db";

export const requestMatchAnalysis: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    //find user from auht middleware
    const { uid } = req.user;
    console.log('user id ',uid)

    // check if user exist
    const user = await prisma.user.findUnique({ where: { UID: uid } });
    console.log('user Status',user)
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
    console.error("Error saving user:", e); // <-- log the actual error
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
