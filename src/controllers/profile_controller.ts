import { Request, RequestHandler, Response } from "express";
import { RequestMatchAnalysisBody } from "../@types";
import { prisma } from "../utils/db";


// list all football player profiles
export const listFootballPlayerProfiles = async (req: Request, res: Response) => {
    try {
        const footballPlayerProfiles = await prisma.playerInfo.findMany({
            where: {
              profileType: "Football Player",
            },
          }); 
          res.status(200).json({status: "success", message: "Football player profiles listed successfully", data: footballPlayerProfiles});
    } catch (error: any) {
        res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
    }
};

export const listScoutProfiles = async (req: Request, res: Response) => {
    try {
        const scoutProfiles = await prisma.playerInfo.findMany({
            where: {
              profileType: "Scout",
            },
          }); 
          res.status(200).json({status: "success", message: "Scout profiles listed successfully", data: scoutProfiles});
    } catch (error: any) {
        res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
    }
};