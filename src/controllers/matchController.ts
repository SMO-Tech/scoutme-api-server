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

    // check if user exist
    const user = await prisma.user.findUnique({ where: { id: uid } });

    if (!user) return res.status(400).json({ error: "user not found!" });

    //destructure the body
    const { videoUrl, Player, lineUpImage, Club } =
      req.body as RequestMatchAnalysisBody;

    // 1. create match
    const match = await prisma.match.create({
      data: {
        userId: uid,
        videoUrl,
        lineUpImage,
        status: "PENDING",
      },
    });

    // 2.  create matchPlayer + create PlayerProfile  + if playerProfileExist link wiht existing Player Profile

    // 3. Create matchClubProfile + Create Club Profile + if exist link matchClub profile with existing ClubProfile
    

    return res.status(201).json({
      message: "Match analysis request created succesfully!",
      data: match,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

// export const allmatchRequestsOfUser: RequestHandler = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     //find user from auht middleware
//     const { uid } = req.user;

//     // check if user exist
//     const user = await prisma.user.findUnique({ where: {id: uid } });
//     if (!user) return res.status(400).json({ error: "user not found!" });

//     const allMatchRequests = await prisma.match.findMany({
//       //find all match analysis request by User
//       where: {
//         userId: user.id,
//       },
//       //order by newest request
//       orderBy: {
//         createdAt: "desc",
//       },
//       //select the field to fetch
//       select: {
//         status: true,
//         id: true,
//         createdAt: true,
//       },
//     });

//     return res.status(201).json({
//       message: "Match requestes fetched successfully",
//       data: allMatchRequests,
//     });
//   } catch (e: any) {
//     res.status(500).json({ error: e.message || "Something went wrong" });
//   }
// };

// export const getSpecificMatchAnalysis: RequestHandler = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     //find user from auht middleware
//     const { uid } = req.user;

//     // check if user exist
//     const user = await prisma.user.findUnique({ where: { UID: uid } });
//     if (!user) return res.status(400).json({ error: "user not found!" });

//     //get the matchId
//     const { matchId } = req.params;

//     //if no matchId return error
//     if (!matchId) return res.status(400).json({ error: "matchId not found!" });

//     //check if matchId exist
//     const isValidId = await prisma.matchRequest.findUnique({
//       where: { id: matchId },
//     });
//     //if no id mathces return error
//     if (!isValidId)
//       return res.status(400).json({ error: "The match is not found" });

//     const matchInfo = await prisma.matchRequest.findUnique({
//       where: { id: matchId },
//       select: {
//         id: true,
//         videoUrl: true,
//         status: true,
//         players: {
//           select: {
//             name: true,
//             jerseyNumber: true,
//             position: true,
//           },
//         },
//         analysis: {
//           select: {
//             result: true,
//           },
//         },
//       },
//     });

//     return res.status(201).json({
//       message: "Match information is successfully fetched!",
//       data: matchInfo,
//     });
//   } catch (e: any) {
//     res.status(500).json({ error: e.message || "Something went wrong" });
//   }
// };

// export const updateMatchStatus: RequestHandler = async (req, res) => {
//   try {
//     const { uid } = req.user as { uid: string };

//     const user = await prisma.user.findUnique({ where: { UID: uid } });
//     if (!user) return res.status(404).json({ error: "User not found!" });

//     const { matchId } = req.params;
//     if (!matchId) return res.status(400).json({ error: "matchId not found!" });

//     const match = await prisma.matchRequest.findUnique({
//       where: { id: matchId },
//     });
//     if (!match) return res.status(404).json({ error: "Match not found!" });

//     const { status } = req.body as MatchStatusBody;
//     if (!["PENDING", "PROCESSING", "COMPLETED"].includes(status))
//       return res.status(400).json({ error: "Invalid or missing status" });

//     await prisma.matchRequest.update({
//       where: { id: matchId },
//       data: { status },
//     });

//     return res
//       .status(200)
//       .json({ message: `Match status updated to ${status}` });
//   } catch (e: any) {
//     return res.status(500).json({ error: e.message || "Something went wrong" });
//   }
// };
