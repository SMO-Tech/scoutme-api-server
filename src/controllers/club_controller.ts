import { Request, RequestHandler, Response } from "express";
import { RequestMatchAnalysisBody } from "../@types";
import { prisma } from "../utils/db";


// List all clubs
export const listClubs = async ( req: Request, res: Response) => {
  try {
    const clubs = await prisma.club.findMany();
    res.status(200).json({ status: "success", message: "Clubs listed successfully", data : clubs });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
  }
};

// Get a club by id
export const getClubById = async ( req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const club = await prisma.club.findUnique({ where: { id } });
   
    res.status(200).json({ status: "success", message: "Club fetched successfully", data : club });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
  }
};

// create a new club
export const createClub = async ( req: Request, res: Response) => {
  try {
    const { name, country, logoUrl } = req.body;
    const club = await prisma.club.create({
      data: { name, country, logoUrl },
    });
    res.status(200).json({ status: "success", message: "Club created successfully", data : club });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
  }
};

// update a club
export const updateClub = async ( req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, country, logoUrl } = req.body;
    const club = await prisma.club.update({ where: { id }, data: { name, country, logoUrl } });
    res.status(200).json({ status: "success", message: "Club updated successfully", data : club });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
  }
};

// delete a club
export const deleteClub = async ( req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const club = await prisma.club.delete({ where: { id } });
    if (!club) {
      return res.status(404).json({ status: "error", message: "Club not found" });
    }
    res.status(200).json({ status: "success", message: "Club deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
  }
};