import { Request, RequestHandler, Response } from "express";
import { RequestMatchAnalysisBody } from "../@types";
import { prisma } from "../utils/db";
import { formatDate } from "../utils/helper_functions";

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date | null): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Validate the date - return null for invalid dates
    if (isNaN(birthDate.getTime())) return null;
    
    // Return null for dates that are clearly invalid (before 1900 or in the future)
    const birthYear = birthDate.getFullYear();
    const currentYear = today.getFullYear();
    if (birthYear < 1900 || birthYear > currentYear) {
        return null;
    }
    
    let age = currentYear - birthYear;
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    // Return null for negative ages (future dates) or unreasonably high ages
    if (age < 0 || age > 150) {
        return null;
    }
    
    return age; 
}

// List all clubs with cursor-based pagination
export const listClubs = async ( req: Request, res: Response) => {
  try {
    // Parse query parameters
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 4; // Default 4 (for 4 items per row), max 100
    const take = Math.min(limit, 100); // Cap at 100 records per page

    // Build query with cursor pagination
    const queryOptions: any = {
      select: {
        id: true,
        name: true,
        country: true,
        logoUrl: true,
        thumbIconUrl: true,
        thumbNormalUrl: true,
        thumbProfileUrl: true,
        thumbUrl: true,
        description: true,
        memberCount: true,
        viewCount: true,
      },
      take: take + 1, // Fetch one extra to check if there's a next page
      orderBy: {
        id: 'asc', // Order by id for consistent cursor pagination
      }
    };

    // Add cursor if provided
    if (cursor) {
      queryOptions.cursor = {
        id: cursor
      };
      queryOptions.skip = 1; // Skip the cursor record itself
    }

    const clubs = await prisma.club.findMany(queryOptions);

    // Check if there's a next page
    const hasNextPage = clubs.length > take;
    const clubList = hasNextPage ? clubs.slice(0, take) : clubs;
    const nextCursor = hasNextPage ? clubList[clubList.length - 1].id : null;

    const formattedClubs = clubList.map((club) => {
      // Get primary image URL - prioritize thumbNormalUrl, then fallback to others
      const imageUrl = club.thumbNormalUrl || 
                     club.thumbProfileUrl || 
                     club.thumbUrl || 
                     club.thumbIconUrl || 
                     club.logoUrl || 
                     null;

      return {
        id: club.id,
        name: club.name,
        country: club.country,
        description: club.description,
        memberCount: club.memberCount,
        viewCount: club.viewCount,
        imageUrl, // Primary image for easy access
        profile: {
          logoUrl: club.logoUrl,
          thumbUrl: club.thumbUrl,
          thumbProfileUrl: club.thumbProfileUrl,
          thumbNormalUrl: club.thumbNormalUrl,
          thumbIconUrl: club.thumbIconUrl,
        },
      };
    });

    res.status(200).json({
      status: "success",
      message: "Clubs listed successfully",
      data: formattedClubs,
      pagination: {
        hasNextPage,
        nextCursor,
        limit: take,
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
  }
};

// Get a club by id
export const getClubById = async ( req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Fetch club first
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) {
      return res.status(404).json({ status: "error", message: "Club not found" });
    }

    // Fetch players from PlayerProfile table where club matches club name
    const players = await prisma.playerProfile.findMany({
      where: { 
        club: club.name 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        primaryPosition: true,
        city: true,
        state: true,
        country: true,
        thumbIconUrl: true,
        thumbNormalUrl: true,
        thumbProfileUrl: true,
        thumbUrl: true,
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    // Get primary image URL for club
    const clubImageUrl = club.thumbNormalUrl || 
                        club.thumbProfileUrl || 
                        club.thumbUrl || 
                        club.thumbIconUrl || 
                        club.logoUrl || 
                        null;

    // Format player profiles - only essential info (matching player list format)
    const members = players.map(player => {
      // Build location string from city, state, country
      const locationParts = [player.city, player.state, player.country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : null;

      // Get primary image URL - prioritize thumbNormalUrl, then fallback to others
      const imageUrl = player.thumbNormalUrl || 
                      player.thumbProfileUrl || 
                      player.thumbUrl || 
                      player.thumbIconUrl || 
                      null;

      return {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`.trim(),
        position: player.primaryPosition,
        location,
        age: calculateAge(player.dateOfBirth),
        imageUrl,
        profile: {
          thumbUrl: player.thumbUrl,
          thumbProfileUrl: player.thumbProfileUrl,
          thumbNormalUrl: player.thumbNormalUrl,
          thumbIconUrl: player.thumbIconUrl,
        },
      };
    });

    // Format the club response
    const formattedClub = {
      id: club.id,
      name: club.name,
      country: club.country,
      description: club.description,
      memberCount: club.memberCount,
      viewCount: club.viewCount,
      clubId: club.clubId,
      status: club.status,
      imageUrl: clubImageUrl,
      profile: {
        logoUrl: club.logoUrl,
        thumbUrl: club.thumbUrl,
        thumbProfileUrl: club.thumbProfileUrl,
        thumbNormalUrl: club.thumbNormalUrl,
        thumbIconUrl: club.thumbIconUrl,
      },
      createdAt: formatDate(new Date(club.createdAt)),
      members, // Players from PlayerProfile table
      playerCount: members.length,
    };
   
    res.status(200).json({ 
      status: "success", 
      message: "Club fetched successfully", 
      data: formattedClub 
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: "error", 
      message: "Something went wrong", 
      error: error.message || "Something went wrong" 
    });
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