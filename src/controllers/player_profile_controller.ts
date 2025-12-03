import {Request, RequestHandler, Response} from "express";
import {RequestMatchAnalysisBody} from "../@types";
import {prisma} from "../utils/db";

// Helper function to format date as DD-MM-YYYY
const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// List all player profiles
export const listPlayerProfiles = async (req : Request, res : Response) => {
    try {
        const playerProfiles = await prisma.playerProfile.findMany();
        const formattedProfiles = playerProfiles.map((profile) => ({
            ...profile,
            dateOfBirth: profile.dateOfBirth ? formatDate(new Date(profile.dateOfBirth)) : null
        }));
        res.status(200).json({status: "success", message: "Player profiles listed successfully", data: formattedProfiles});
    } catch (error : any) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};

// Get a player profile by id
export const getPlayerProfileById = async (req : Request, res : Response) => {
    try {
        const {id} = req.params;
        const playerProfile = await prisma.playerProfile.findUnique({where: {
                id
            }});
        if (! playerProfile) {
            return res.status(404).json({status: "error", message: "Player profile not found"});
        }
        const formattedProfile = {
            ... playerProfile,
            dateOfBirth: playerProfile.dateOfBirth ? formatDate(new Date(playerProfile.dateOfBirth)) : null
        };
        res.status(200).json({status: "success", message: "Player profile fetched successfully", data: formattedProfile});
    } catch (error : any) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};

// search player profiles by parameters
export const searchPlayerProfiles = async (req : Request, res : Response) => {
    try {
        const {firstName, lastName, dateOfBirth, country} = req.query;
        console.log(req.query);
        console.log(firstName, lastName, dateOfBirth, country);
        // Build where clause conditionally
        const where: any = {};
        
        if (firstName && typeof firstName === 'string') {
            where.firstName = {contains: firstName, mode: 'insensitive'};
        }
        if (lastName && typeof lastName === 'string') {
            where.lastName = {contains: lastName, mode: 'insensitive'};
        }
        if (dateOfBirth && typeof dateOfBirth === 'string') {
            // Parse date string (expecting DD-MM-YYYY or YYYY-MM-DD format)
            const date = new Date(dateOfBirth);
            if (!isNaN(date.getTime())) {
                where.dateOfBirth = {equals: date};
            }
        }
        if (country && typeof country === 'string') {
            where.country = {contains: country, mode: 'insensitive'};
        }
        
        const playerProfiles = await prisma.playerProfile.findMany({where});
        const formattedProfiles = playerProfiles.map((profile) => ({
            ...profile,
            dateOfBirth: profile.dateOfBirth ? formatDate(new Date(profile.dateOfBirth)) : null
        }));
        res.status(200).json({status: "success", message: "Player profiles searched successfully", data: formattedProfiles});
    } catch (error : any) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};
